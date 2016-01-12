import 'reflect-metadata';

type Constructable<T> = { new(): T; };
type InjectMetadata = {
  property: string,
  rtti: Constructable<any>;
};
type ComponentListener = (component: Function) => void;

let listeners: ComponentListener[] = [];
const knownComponents: Function[] = [];

function addKnownComponent(component: Function): void {
  knownComponents.push(component);
  for (let listener of listeners) {
    listener(component);
  }
}

function addListener(listener: ComponentListener): void {
  listeners.push(listener);
  for (let component of knownComponents) {
    listener(component);
  }
}

export class TSDI {

  private components: Constructable<any>[] = [];

  private instances: {[idx: number]: Object} = {};

  public enableComponentScanner(): void {
    addListener(this.register.bind(this));
  }

  public register(component: Constructable<any>): void {
    if (this.components.indexOf(component) == -1) {
      this.components.push(component);
    }
  }

  public get<T>(component: Constructable<T>): T {
    const idx: number = this.components.indexOf(component);
    let instance: any = this.instances[idx];
    if (!instance) {
      const template: Function = this.components[idx];
      const constructor: ObjectConstructor =  Reflect.getMetadata('component:constructor', template);
      instance = new constructor();
      let injects: InjectMetadata[] = Reflect.getMetadata('component:injects', template.prototype);
      if (injects) {
        for (let inject of injects) {
          instance[inject.property] = this.get(this.components[this.components.indexOf(inject.rtti)]);
        }
      }
      const init: string = Reflect.getMetadata('component:init', template.prototype);
      if (init) {
        (instance[init] as Function).call(instance);
      }
    }
    this.instances[idx] = instance;
    return instance;
  }

}

export function Component(): ClassDecorator {
  return function<TFunction extends Function>(target: TFunction): TFunction {
    addKnownComponent(target);
    Reflect.defineMetadata('component:constructor', target, target);
    return target;
  };
}

export function Inject(): PropertyDecorator {
  return function(target: Object, propertyKey: string): void {
    const rtti: Constructable<any> = Reflect.getMetadata('design:type', target, propertyKey);

    let injects: InjectMetadata[] = Reflect.getMetadata('component:injects', target);
    if (!injects) {
      injects = [];
      Reflect.defineMetadata('component:injects', injects, target);
    }
    injects.push({
      property: propertyKey,
      rtti
    });
  };
}

export function Initialize(): MethodDecorator {
  return function(target: Object, propertyKey: string): void {
    Reflect.defineMetadata('component:init', propertyKey, target);
  };
}
