import { debug } from './debug';
const log = debug('tsdi');

export function Destroy(target: object, propertyKey: string): void;
export function Destroy(): MethodDecorator;
export function Destroy(...args: any[]): MethodDecorator | void {
  const decorate = (target: object, propertyKey: symbol | string) => {
    log('@Destroy %s#%s', (target.constructor as any).name, propertyKey);
    if (!Reflect.defineMetadata) {
      return;
    }
    Reflect.defineMetadata('component:destroy', propertyKey, target);
  };
  if (args.length > 0) {
    return decorate(args[0], args[1]);
  }
  return function(target: object, propertyKey: symbol | string): void {
    decorate(target, propertyKey);
  };
}
