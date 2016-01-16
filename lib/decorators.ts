import 'reflect-metadata';

type Constructable<T> = { new(): T; };

export interface IComponentOptions {
  name?: string;
}

export interface IInjectOptions {
  name?: string;
}

type InjectMetadata = {
  property: string;
  rtti: Constructable<any>;
  options: IInjectOptions;
};

type ComponentMetadata = {
  fn: Constructable<any>;
  options: IComponentOptions;
};

type ComponentListener = (componentMetadata: ComponentMetadata) => void;

let listeners: ComponentListener[] = [];
const knownComponents: ComponentMetadata[] = [];

function addKnownComponent(componentMetadata: ComponentMetadata): void {
  knownComponents.push(componentMetadata);
  for (let listener of listeners) {
    listener(componentMetadata);
  }
}

function addListener(listener: ComponentListener): void {
  listeners.push(listener);
  for (let componentMetadata of knownComponents) {
    listener(componentMetadata);
  }
}

export class TSDI {

  private components: ComponentMetadata[] = [];

  private instances: {[idx: number]: Object} = {};

  public enableComponentScanner(): void {
    addListener(this.registerComponent.bind(this));
  }

  private registerComponent(componentMetadata: ComponentMetadata): void {
    if (this.components.indexOf(componentMetadata) == -1) {
      this.components.push(componentMetadata);
    }
  }

  public register(component: Constructable<any>, name?: string): void {
    this.registerComponent({
      fn: component,
      options: {
        name
      }
    });
  }

  private getComponentMetadataIndex(component: Constructable<any>, name?: string): number {
    let idx: number;
    for (let i: number = 0, n: number = this.components.length; i < n; i++) {
      const componentMetadata: ComponentMetadata = this.components[i];
      if (name && name == componentMetadata.options.name) {
        return i;
      } else if (componentMetadata.fn == component) {
        idx = i;
      }
    }
    return idx;
  }

  public get<T>(component: Constructable<T>, hint?: string): T {
    let idx: number = this.getComponentMetadataIndex(component, hint);
    let instance: any = this.instances[idx];
    if (!instance) {
      const componentMetadata: ComponentMetadata = this.components[idx];
      const constructor: ObjectConstructor =  Reflect.getMetadata('component:constructor', componentMetadata.fn);
      instance = new constructor();
      let injects: InjectMetadata[] = Reflect.getMetadata('component:injects', componentMetadata.fn.prototype);
      if (injects) {
        for (let inject of injects) {
          const injectIdx: number = this.getComponentMetadataIndex(inject.rtti, inject.options.name);
          instance[inject.property] = this.get(this.components[injectIdx].fn);
        }
      }
      const init: string = Reflect.getMetadata('component:init', componentMetadata.fn.prototype);
      if (init) {
        (instance[init] as Function).call(instance);
      }
    }
    this.instances[idx] = instance;
    return instance;
  }

}

export function Component(options: IComponentOptions = {}): ClassDecorator {
  return function<TFunction extends Function>(target: TFunction): TFunction {
    addKnownComponent({
      fn: target as any,
      options
    });
    Reflect.defineMetadata('component:constructor', target, target);
    return target;
  };
}

export function Inject(options: IInjectOptions = {}): PropertyDecorator {
  return function(target: Object, propertyKey: string): void {
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
  };
}

export function Initialize(): MethodDecorator {
  return function(target: Object, propertyKey: string): void {
    Reflect.defineMetadata('component:init', propertyKey, target);
  };
}
