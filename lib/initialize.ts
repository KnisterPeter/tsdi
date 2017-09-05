import * as debug from 'debug';
const log = debug('tsdi');

export function Initialize(target: Object, propertyKey: string): void;
export function Initialize(): MethodDecorator;
export function Initialize(...args: any[]): MethodDecorator | void {
  const decorate = (target: Object, propertyKey: string) => {
    log('@Initialize %s#%s', (target.constructor as any).name, propertyKey);
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
