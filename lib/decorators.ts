import 'reflect-metadata';

export type Constructable<T> = { new(...args: any[]): T; };

export interface IComponentOptions {
  name?: string;
  singleton?: boolean;
}

export interface IInjectOptions {
  name?: string;
}

export interface IFactoryOptions {
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
type ComponentListener = (metadata: ComponentOrFactoryMetadata) => void;

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
let knownComponents: ComponentOrFactoryMetadata[] = [];

function addKnownComponent(metadata: ComponentOrFactoryMetadata): void {
  if (metadata.options.name && findIndexOf(knownComponents, meta => meta.options.name == metadata.options.name) > -1) {
    throw new Error(`Duplicate name '${metadata.options.name}' for known Components.`);
  }
  knownComponents.push(metadata);
  listeners.forEach(listener => listener(metadata));
}

function addListener(listener: ComponentListener): void {
  listeners.push(listener);
  knownComponents.forEach(metadata => listener(metadata));
}

function removeListener(listener: ComponentListener): void {
  listeners = removeElement(listeners, l => l == listener);
}

export class TSDI {

  private components: ComponentOrFactoryMetadata[] = [];

  private instances: {[idx: number]: Object} = {};

  private listener: ComponentListener;

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
      this.listener = null;
    }
  }

  public enableComponentScanner(): void {
    if (!this.listener) {
      this.listener = this.registerComponent.bind(this);
      addListener(this.listener);
    }
  }

  private registerComponent(componentMetadata: ComponentMetadata): void {
    if (this.components.indexOf(componentMetadata) == -1) {
      if (componentMetadata.options.name && findIndexOf(this.components,
          meta => meta.options.name == componentMetadata.options.name) > -1) {
        console.warn(`Component with name '${componentMetadata.options.name}' already registered.`);
      }

      this.components.push(componentMetadata);
    }
  }

  public register(component: Constructable<any>, name?: string): void {
    let componentName: string = name;
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

  private getComponentMetadataIndex(component: Constructable<any>, name?: string): number {
    let idx: number = -1;
    for (let i = 0, n = this.components.length; i < n; i++) {
      const metadata = this.components[i];
      if (name && name === metadata.options.name) {
        return i;
      } else if (typeof component !== 'undefined'
          && ((metadata as ComponentMetadata).fn === component
            || (metadata as FactoryMetadata).rtti === component)) {
        idx = i;
      }
    }
    return idx;
  }

  private throwComponentNotFoundError(component: Constructable<any>, name: string): void {
    if (component && !name) {
      name = (component as any).name;
    }
    if (!name) {
      name = 'unknown';
    }
    throw new Error(`Component '${name}' not found`);
  }

  private getConstructorParameters(metadata: ComponentOrFactoryMetadata): any[] {
    let parameterMetadata: ParameterMetadata[] = Reflect.getMetadata('component:parameters',
      (metadata as ComponentMetadata).fn);
    if (parameterMetadata) {
      return parameterMetadata
        .sort((a, b) => a.index - b.index)
        .map(parameter => this.getComponentMetadataIndex(parameter.rtti, parameter.options.name))
        .map(index => this.getOrCreate(this.components[index], index));
    }
    return [];
  }

  private isSingleton(metadata: ComponentOrFactoryMetadata): boolean {
    return typeof metadata.options.singleton == 'undefined' || metadata.options.singleton;
  }

  private getOrCreate<T>(metadata: ComponentOrFactoryMetadata, idx: number): T {
    // TODO: Use T here
    let instance: any = this.instances[idx];
    if (!instance || !this.isSingleton(metadata)) {
      if ((metadata as FactoryMetadata).rtti) {
        const factoryMetadata = metadata as FactoryMetadata;
        instance = (this.get(factoryMetadata.target.constructor as any) as any)[factoryMetadata.property]();
        this.instances[idx] = instance;
      } else {
        const componentMetadata = metadata as ComponentMetadata;
        const constructor: Constructable<T> =  componentMetadata.fn as any;
        let parameters = this.getConstructorParameters(metadata);
        instance = new constructor(...parameters);
        // Note: This stores an incomplete instance (injects/properties/...)
        // But it allows recursive use of injects
        this.instances[idx] = instance;
        let injects: InjectMetadata[] = Reflect.getMetadata('component:injects', componentMetadata.fn.prototype);
        if (injects) {
          for (let inject of injects) {
            if (inject.options.name && typeof this.properties[inject.options.name] != 'undefined') {
              instance[inject.property] = this.properties[inject.options.name];
            } else {
              let injectIdx = this.getComponentMetadataIndex(inject.type, inject.options.name);
              if (injectIdx === -1) {
                if (!inject.type || inject.options.name) {
                  throw new Error('Injecting undefined type on ' + (inject.target.constructor as any).name
                    + '#' + inject.property + ': Probably a cyclic dependency, switch to name based injection');
                }
                injectIdx = this.getComponentMetadataIndex(inject.type, (inject.type as any).name);
              }
              const injectMetadata = this.components[injectIdx];
              if (!injectMetadata) {
                throw new Error(`Failed to get inject '${inject.options.name}' for '${(inject.target.constructor as any).name}#${inject.property}'`);
              }
              instance[inject.property] = this.getOrCreate(injectMetadata, injectIdx);
            }
          }
        }
        const init: string = Reflect.getMetadata('component:init', componentMetadata.fn.prototype);
        if (init) {
          (instance[init] as Function).call(instance);
        }
      }
    }
    return instance;
  }

  public get<T>(hint: string): T;
  public get<T>(component: Constructable<T>): T;
  public get<T>(component: Constructable<T>, hint: string): T;
  public get<T>(componentOrHint: Constructable<T>|string, hint?: string): T {
    let component: Constructable<T>;
    if (typeof componentOrHint === 'string') {
      hint = componentOrHint as any;
      component = undefined;
    } else {
      component = componentOrHint as Constructable<T>;
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
    return {
      name: optionOrString
    } as any;
  }
  return optionOrString as T;
}

export function Component(optionsOrString: IComponentOptions | string = {}): ClassDecorator {
  return function<TFunction extends Function>(target: TFunction): TFunction {
    // console.log(`@Component ${(target as any).name}`);
    const options = getNamedOptions<IComponentOptions>(optionsOrString);
    if (!options.name) {
      options.name = (target as any).name;
    }
    addKnownComponent({
      fn: target as any,
      options
    });
    Reflect.defineMetadata('component:options', options, target);
    return target;
  };
}

export function Inject(optionsOrString: IInjectOptions | string = {}): PropertyDecorator & ParameterDecorator {
  return function(target: Object, propertyKey: string, parameterIndex?: number): void {
    const options = getNamedOptions<IInjectOptions>(optionsOrString);
    if (typeof parameterIndex == 'undefined') {
      // Annotated property
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
    } else {
      // Annotated parameter
      // console.log(`@Inject ${propertyKey}`);
      let parameters: ParameterMetadata[] = Reflect.getMetadata('component:parameters', target);
      if (!parameters) {
        parameters = [];
        Reflect.defineMetadata('component:parameters', parameters, target);
      }
      parameters.push({
        options,
        index: parameterIndex,
        rtti: Reflect.getMetadata('design:paramtypes', target, propertyKey)[parameterIndex]
      });
    }
  };
}

export function Initialize(): MethodDecorator {
  return function(target: Object, propertyKey: string): void {
    // console.log(`@Initialize ${(target as any)[propertyKey].name}`);
    Reflect.defineMetadata('component:init', propertyKey, target);
  };
}

export function Factory(options: IFactoryOptions = {}): MethodDecorator {
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
