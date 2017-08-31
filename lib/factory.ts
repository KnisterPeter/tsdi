import { IFactoryOptions } from './decorators';
import { addKnownComponent } from './global-state';

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
