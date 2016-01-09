import 'reflect-metadata';

export class TSDI {

  private components: Object[] = [];

  private instances: {[idx: number]: Object} = {};

  public register(component: Object): void {
    if (this.components.indexOf(component) == -1) {
      this.components.push(component);
    }
  }

  public get(component: any): any {
    const idx: number = this.components.indexOf(component);
    let instance: any = this.instances[idx];
    if (!instance) {
      const constructor: any =  Reflect.getMetadata('component:constructor', this.components[idx]);
      instance = new (constructor)();
      let injects: any[] = Reflect.getMetadata('component:injects', component);
      if (injects) {
        for (let inject of injects) {
          instance[inject.property] = this.get(this.components[this.components.indexOf(inject.rtti)]);
        }
      }
    }
    this.instances[idx] = instance;
    return instance;
  }

}

export function Component<T>(target: any): any {
  Reflect.defineMetadata('component:constructor', target, target);
  let injects: any[] = Reflect.getMetadata('component:injects', target.prototype);
  Reflect.deleteMetadata('component:injects', target.prototype);
  Reflect.defineMetadata('component:injects', injects, target);
  return target;
}

export function Inject(target: Object, propertyKey: string): void {
  const rtti: any = Reflect.getMetadata('design:type', target, propertyKey);

  let injects: any[] = Reflect.getMetadata('component:injects', target);
  if (!injects) {
    injects = [];
    Reflect.defineMetadata('component:injects', injects, target);
  }
  injects.push({
    property: propertyKey,
    rtti: rtti
  });
}
