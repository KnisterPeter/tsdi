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
  property: string;
  rtti: Constructable<any>;
  options: IInjectOptions;
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
  factoryType: Constructable<any>;
  fn: <T>(...args: any[]) => T;
  options: IFactoryOptions;
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
    console.warn(`Component with name '${metadata.options.name}' already defined.`);
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
        throw new Error(`Component with name '${componentMetadata.options.name}' already registered.`);
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
    let idx: number;
    for (let i = 0, n = this.components.length; i < n; i++) {
      const metadata = this.components[i];
      if (name && name == metadata.options.name) {
        return i;
      } else if (metadata.fn == component || (metadata as FactoryMetadata).factoryType == component) {
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
    let parameterMetadata: ParameterMetadata[] = Reflect.getMetadata('component:parameters', metadata.fn);
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
    let instance: any = this.instances[idx];
    if (!instance || !this.isSingleton(metadata)) {
      if ((metadata as FactoryMetadata).factoryType) {
        instance = (metadata as FactoryMetadata).fn(this);
        this.instances[idx] = instance;
      } else {
        const constructor: any =  Reflect.getMetadata('component:constructor', metadata.fn);
        let parameters = this.getConstructorParameters(metadata);
        instance = new constructor(...parameters);
        // Note: This stores an incomplete instance (injects/properties/...)
        // But it allows recursive use of injects
        this.instances[idx] = instance;
        let injects: InjectMetadata[] = Reflect.getMetadata('component:injects', metadata.fn.prototype);
        if (injects) {
          for (let inject of injects) {
            if (inject.options.name && typeof this.properties[inject.options.name] != 'undefined') {
              instance[inject.property] = this.properties[inject.options.name];
            } else {
              const injectIdx = this.getComponentMetadataIndex(inject.rtti, inject.options.name);
              if (!this.components[injectIdx]) {
                throw new Error(`Failed to get inject '${inject.options.name}'`);
              }
              instance[inject.property] = this.getOrCreate(this.components[injectIdx], injectIdx);
            }
          }
        }
        const init: string = Reflect.getMetadata('component:init', metadata.fn.prototype);
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

export function Component(options: IComponentOptions = {}): ClassDecorator {
  return function<TFunction extends Function>(target: TFunction): TFunction {
    addKnownComponent({
      fn: target as any,
      options
    });
    Reflect.defineMetadata('component:constructor', target, target);
    Reflect.defineMetadata('component:options', options, target);
    return target;
  };
}

export function Inject(options: IInjectOptions = {}): any {
  return function(target: Object, propertyKey: string, index?: number): void {
    if (typeof index == 'undefined') {
      // Annotated property
      const rtti: Constructable<any> = Reflect.getMetadata('design:type', target, propertyKey);

      let injects: InjectMetadata[] = Reflect.getMetadata('component:injects', target);
      if (!injects) {
        injects = [];
        Reflect.defineMetadata('component:injects', injects, target);
      }
      injects.push({
        property: propertyKey,
        rtti,
        options
      });
    } else {
      // Annotated parameter
      const rtti: any = Reflect.getMetadata('design:paramtypes', target, propertyKey);

      let parameters: ParameterMetadata[] = Reflect.getMetadata('component:parameters', target);
      if (!parameters) {
        parameters = [];
        Reflect.defineMetadata('component:parameters', parameters, target);
      }
      parameters.push({
        index,
        rtti: rtti[index],
        options
      });
    }
  };
}

export function Initialize(): MethodDecorator {
  return function(target: Object, propertyKey: string): void {
    Reflect.defineMetadata('component:init', propertyKey, target);
  };
}

export function Factory(options: IFactoryOptions = {}): MethodDecorator {
  return function(target: Object, propertyKey: string): void {
    const rtti = Reflect.getMetadata('design:returntype', target, propertyKey);
    addKnownComponent({
      factoryType: rtti,
      fn: (tsdi: TSDI): any => {
        return (tsdi.get((target as any).prototype) as any)[propertyKey]();
      },
      options
    });
  };
}
