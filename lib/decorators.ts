import 'reflect-metadata';

export type Constructable<T> = { new(...args: any[]): T; };

export type IComponentOptions = ComponentOptions;
export interface ComponentOptions {
  name?: string;
  singleton?: boolean;
}

export type IInjectOptions = InjectOptions;
export interface InjectOptions {
  name?: string;
  lazy?: boolean;
}

export type IFactoryOptions = FactoryOptions;
export interface FactoryOptions {
  name?: string;
  singleton?: boolean;
}

type InjectMetadata = {
  target: Object;
  property: string;
  options: IInjectOptions;
  type: Constructable<any>;
};

type ParameterMetadata = {
  index: number;
  rtti: Constructable<any>;
  options: IInjectOptions;
};

type ComponentMetadata = {
  fn: Constructable<any>;
  options: IComponentOptions;
};

type FactoryMetadata = {
  target: Object;
  property: string;
  options: IFactoryOptions;
  rtti: Constructable<any>;
};

type ComponentOrFactoryMetadata = ComponentMetadata | FactoryMetadata;
type ComponentListener = (metadataOrExternal: ComponentOrFactoryMetadata | Function) => void;

function isFactoryMetadata(metadata: ComponentOrFactoryMetadata): metadata is FactoryMetadata {
  return Boolean((metadata as FactoryMetadata).rtti);
}

function findIndexOf<T>(list: T[], test: (element: T) => boolean): number {
  let idx = -1;
  for (let i = 0, n = list.length; i < n; i++) {
    if (test(list[i])) {
      idx = i;
    }
  }
  return idx;
}

function removeElement<T>(list: T[], test: (element: T) => boolean): T[] {
  const idx = findIndexOf(list, test);
  if (idx > -1) {
    return [...list.slice(0, idx), ...list.slice(idx + 1)];
  }
  return list;
}

let listeners: ComponentListener[] = [];
const knownComponents: ComponentOrFactoryMetadata[] = [];
const knownExternals: Function[] = [];

function addKnownComponent(metadata: ComponentOrFactoryMetadata): void {
  if (metadata.options.name && findIndexOf(knownComponents, meta => meta.options.name === metadata.options.name) > -1) {
    throw new Error(`Duplicate name '${metadata.options.name}' for known Components.`);
  }
  knownComponents.push(metadata);
  listeners.forEach(listener => listener(metadata));
}

function addKnownExternal(external: Function): void {
  if (findIndexOf(knownExternals, fn => fn === external) === -1) {
    knownExternals.push(external);
    listeners.forEach(listener => listener(external));
  }
}

function addListener(listener: ComponentListener): void {
  listeners.push(listener);
  knownComponents.forEach(metadata => listener(metadata));
  knownExternals.forEach(external => listener(external));
}

function removeListener(listener: ComponentListener): void {
  listeners = removeElement(listeners, l => l === listener);
}

export class TSDI {

  private components: ComponentOrFactoryMetadata[] = [];

  private instances: {[idx: number]: Object} = {};

  private listener: ComponentListener|undefined;

  private properties: {[key: string]: any} = {};

  constructor() {
    this.registerComponent({
      fn: TSDI,
      options: {}
    });
    this.instances[0] = this;
  }

  public addProperty(key: string, value: any): void {
    this.properties[key] = value;
  }

  public close(): void {
    if (this.listener) {
      removeListener(this.listener);
      this.listener = undefined;
    }
  }

  public enableComponentScanner(): void {
    if (!this.listener) {
      this.listener = (metadataOrExternal: ComponentOrFactoryMetadata | Function) => {
        if (typeof metadataOrExternal === 'function')  {
          (metadataOrExternal as any).__tsdi__ = this;
        } else {
          this.registerComponent(metadataOrExternal);
        }
      };
      if (this.listener) {
        addListener(this.listener);
      }
    }
  }

  private registerComponent(componentMetadata: ComponentOrFactoryMetadata): void {
    if (this.components.indexOf(componentMetadata) === -1) {
      if (componentMetadata.options.name && findIndexOf(this.components,
          meta => meta.options.name === componentMetadata.options.name) > -1) {
        console.warn(`Component with name '${componentMetadata.options.name}' already registered.`);
      }

      this.components.push(componentMetadata);
    }
  }

  public register(component: Constructable<any>, name?: string): void {
    let componentName = name;
    if (!componentName) {
      const options: IComponentOptions =  Reflect.getMetadata('component:options', component);
      if (options) {
        componentName = options.name;
      }
    }
    this.registerComponent({
      fn: component,
      options: {
        name: componentName
      }
    });
  }

  private getComponentMetadataIndex(component: Constructable<any> | undefined, name?: string): number {
    for (let i = 0, n = this.components.length; i < n; i++) {
      if (name) {
        if (name === this.components[i].options.name) {
          return i;
        }
      } else {
        if (this.isComponentMetadataIndexFromComponentOrFactory(component, this.components[i])) {
          return i;
        }
      }
    }
    return -1;
  }

  private isComponentMetadataIndexFromComponentOrFactory(component: Constructable<any> | undefined,
      metadata: ComponentOrFactoryMetadata): boolean {
    return typeof component !== 'undefined'
          && ((metadata as ComponentMetadata).fn === component
            || isFactoryMetadata(metadata)
              && metadata.rtti === component);
  }

  private throwComponentNotFoundError(component: Constructable<any> | undefined, name: string | undefined): void {
    if (component && !name) {
      name = (component as any).name;
    }
    if (!name) {
      name = 'unknown';
    }
    throw new Error(`Component '${name}' not found`);
  }

  private getConstructorParameters(metadata: ComponentOrFactoryMetadata): any[] {
    const parameterMetadata: ParameterMetadata[] = Reflect.getMetadata('component:parameters',
      (metadata as ComponentMetadata).fn);
    if (parameterMetadata) {
      return parameterMetadata
        .sort((a, b) => a.index - b.index)
        .map(parameter => ({index: this.getComponentMetadataIndex(parameter.rtti, parameter.options.name), parameter}))
        .map(({index, parameter}) => this.getOrCreate(this.components[index], index));
    }
    return [];
  }

  private isSingleton(metadata: ComponentOrFactoryMetadata): boolean {
    return typeof metadata.options.singleton === 'undefined' || metadata.options.singleton;
  }

  private getOrCreate<T>(metadata: ComponentOrFactoryMetadata, idx: number): T {
    // todo: Use T here
    let instance: any = this.instances[idx];
    if (!instance || !this.isSingleton(metadata)) {
      if (isFactoryMetadata(metadata)) {
        instance = this.get(metadata.target.constructor as Constructable<any>)[metadata.property]();
        this.instances[idx] = instance;
      } else {
        const constructor: Constructable<T> =  metadata.fn as any;
        const parameters = this.getConstructorParameters(metadata);
        instance = new constructor(...parameters);
        // note: This stores an incomplete instance (injects/properties/...)
        // but it allows recursive use of injects
        this.instances[idx] = instance;
        this.injectIntoInstance(instance, metadata);
        const init: string = Reflect.getMetadata('component:init', metadata.fn.prototype);
        if (init) {
          (instance[init] as Function).call(instance);
        }
      }
    }
    return instance;
  }

  public configureExternal<T>(args: any[], target: any): T {
    const parameters = this.getConstructorParameters({fn: target, options: {}});
    const instance = new target(...args, ...parameters);
    this.injectIntoInstance(instance, {fn: target, options: {}});
    const init: string = Reflect.getMetadata('component:init', target.prototype);
    if (init) {
      instance[init].call(instance);
    }
    return instance;
  }

  private injectIntoInstance(instance: any, componentMetadata: ComponentMetadata): void {
    const injects: InjectMetadata[] = Reflect.getMetadata('component:injects', componentMetadata.fn.prototype);
    if (injects) {
      for (const inject of injects) {
        if (inject.options.name && typeof this.properties[inject.options.name] !== 'undefined') {
          instance[inject.property] = this.properties[inject.options.name];
        } else {
          if (inject.options.lazy) {
            const tsdi = this;
            Object.defineProperty(instance, inject.property, {
              configurable: true,
              enumerable: true,
              get(): any {
                let value = instance[`tsdi$${inject.property}`];
                if (!value) {
                  value = tsdi.getComponentDependency(inject);
                  instance[`tsdi$${inject.property}`] = value;
                }
                return value;
              }
            });
          } else {
            instance[inject.property] = this.getComponentDependency(inject);
          }
        }
      }
    }
  }

  private getComponentDependency(inject: InjectMetadata): any {
    let injectIdx = this.getComponentMetadataIndex(inject.type, inject.options.name);
    if (injectIdx === -1) {
      this.checkAndThrowDependencyError(inject);
      injectIdx = this.getComponentMetadataIndex(inject.type, (inject.type as any).name);
    }
    const injectMetadata = this.components[injectIdx];
    if (!injectMetadata) {
      throw new Error(`Failed to get inject '${inject.options.name}' for `
        + `'${(inject.target.constructor as any).name}#${inject.property}'`);
    }
    return this.getOrCreate(injectMetadata, injectIdx);
  }

  private checkAndThrowDependencyError(inject: InjectMetadata): void {
    if (inject.type && inject.options.name) {
      throw new Error(`Injecting undefined type on ${(inject.target.constructor as any).name}`
        + `#${inject.property}: Component named '${inject.options.name}' not found`);
    }
    if (!inject.type || inject.options.name) {
      throw new Error(`Injecting undefined type on ${(inject.target.constructor as any).name}`
        + `#${inject.property}: Probably a cyclic dependency, switch to name based injection`);
    }
  }

  public get<T>(componentOrHint: string|Constructable<T>): T;
  public get<T>(component: Constructable<T>, hint: string): T;
  public get<T>(componentOrHint: Constructable<T>|string, hint?: string): T {
    let component: Constructable<T> | undefined;
    if (typeof componentOrHint === 'string') {
      hint = componentOrHint as any;
      component = undefined;
    } else {
      component = componentOrHint;
    }
    const idx = this.getComponentMetadataIndex(component, hint);
    const metadata = this.components[idx];
    if (!metadata) {
      this.throwComponentNotFoundError(component, hint);
    }
    return this.getOrCreate<T>(metadata, idx);
  }

}

function getNamedOptions<T extends {name?: string}>(optionOrString: T | string): T {
  if (typeof optionOrString === 'string') {
    const named = {
      name: optionOrString
    };
    return named as T;
  }
  return optionOrString;
}

export function Component<TFunction extends Function>(target: TFunction): TFunction;
export function Component(optionsOrString?: IComponentOptions | string): ClassDecorator;
export function Component<TFunction extends Function>(...args: any[]): ClassDecorator| TFunction {
  const decorate = (target: TFunction, optionsOrString: IComponentOptions | string = {}) => {
    // console.log(`@Component ${(target as any).name}`);
    const options = getNamedOptions<IComponentOptions>(optionsOrString);
    addKnownComponent({
      fn: target as any,
      options
    });
    Reflect.defineMetadata('component:options', options, target);
    return target;
  };

  if (args.length === 1 && typeof args[0] === 'function') {
    return decorate(args[0], {});
  }
  return function(target: TFunction): TFunction {
    return decorate(target, args[0] || {});
  } as ClassDecorator;
}
export const component = Component;

export function External<TFunction extends Function>(target: TFunction): TFunction;
export function External(): ClassDecorator;
export function External<TFunction extends Function>(...args: any[]): ClassDecorator | TFunction {
  const decorate = (target: TFunction) => {
    // console.log(`@External ${(target as any).name}`);
    addKnownExternal(target);
    const constructor = function InjectedConstructor(this: any, ...args: any[]): any {
      return (target as any).__tsdi__.configureExternal(args, target);
    };
    (constructor as any).displayName = (target as any).name;
    constructor.prototype = target.prototype;
    return constructor as any;
  };

  if (args.length > 0) {
    return decorate(args[0]);
  }
  return function(target: TFunction): TFunction {
    return decorate(target);
  } as ClassDecorator;
}
export const external = External;

export function Inject(target: Object, propertyKey: string | symbol, parameterIndex?: number): void;
export function Inject(optionsOrString?: IInjectOptions | string): PropertyDecorator & ParameterDecorator;
export function Inject(...args: any[]): PropertyDecorator & ParameterDecorator | void {
  const defaultOptions = (optionsOrString?: IInjectOptions | string) => {
    const options = getNamedOptions<IInjectOptions>(optionsOrString || {});
    if (options.lazy === undefined) {
      options.lazy = true;
    }
    return options;
  };
  const decorateProperty = (target: Object, propertyKey: string,
      options: IInjectOptions) => {
    // console.log(`@Inject ${(target.constructor as any).name}#${propertyKey}`);
    const type: Constructable<any> = Reflect.getMetadata('design:type', target, propertyKey);
    let injects: InjectMetadata[] = Reflect.getMetadata('component:injects', target);
    if (!injects) {
      injects = [];
      Reflect.defineMetadata('component:injects', injects, target);
    }
    injects.push({
      target,
      property: propertyKey,
      options,
      type
    });
  };
  const decorateParameter = (target: Object, propertyKey: string | symbol, parameterIndex: number,
      options: IInjectOptions) => {
    // console.log(`@Inject ${propertyKey}`);
    let parameters: ParameterMetadata[] = Reflect.getMetadata('component:parameters', target);
    if (!parameters) {
      parameters = [];
      Reflect.defineMetadata('component:parameters', parameters, target);
    }
    parameters.push({
      options,
      index: parameterIndex,
      rtti: Reflect.getMetadata('design:paramtypes', target)[parameterIndex]
    });
  };

  if (args.length > 1) {
    const options = defaultOptions({});
    if (typeof args[2] === 'undefined') {
      decorateProperty(args[0], args[1], options);
    } else {
      decorateParameter(args[0], args[1], args[2], options);
    }
    return;
  }
  return function(target: Object, propertyKey: string, parameterIndex?: number): void {
    const options = defaultOptions(args[0] || {});
    if (typeof parameterIndex === 'undefined') {
      return decorateProperty(target, propertyKey, options);
    } else {
      return decorateParameter(target, propertyKey, parameterIndex, options);
    }
  };
}
export const inject = Inject;

export function Initialize(target: Object, propertyKey: string): void;
export function Initialize(): MethodDecorator;
export function Initialize(...args: any[]): MethodDecorator | void {
  const decorate = (target: Object, propertyKey: string) => {
    // console.log(`@Initialize ${(target as any)[propertyKey].name}`);
    Reflect.defineMetadata('component:init', propertyKey, target);
  };
  if (args.length > 0) {
    return decorate(args[0], args[1]);
  }
  return function(target: Object, propertyKey: string): void {
    decorate(target, propertyKey);
  };
}
export const initialize = Initialize;

export function Factory(target: Object, propertyKey: string): void;
export function Factory(options?: IFactoryOptions): MethodDecorator;
export function Factory(...args: any[]): MethodDecorator | void {
  const decorate = (target: Object, propertyKey: string, options: IFactoryOptions) => {
    // console.log(`@Factory ${(target as any)[propertyKey].name}`);
    addKnownComponent({
      target,
      property: propertyKey,
      options,
      rtti: Reflect.getMetadata('design:returntype', target, propertyKey)
    });
  };

  if (args.length > 1) {
    return decorate(args[0], args[1], {});
  }
  const options = args[0] || {};
  return function(target: Object, propertyKey: string): void {
    // console.log(`@Factory ${(target as any)[propertyKey].name}`);
    addKnownComponent({
      target,
      property: propertyKey,
      options,
      rtti: Reflect.getMetadata('design:returntype', target, propertyKey)
    });
  };
}
export const factory = Factory;
