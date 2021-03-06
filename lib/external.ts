import { debug } from './debug';
import { addKnownExternal } from './global-state';

const log = debug('tsdi');

export function External<TFunction extends Function>(
  target: TFunction
): TFunction;
export function External(): ClassDecorator;
export function External<TFunction extends Function>(
  ...args: any[]
): ClassDecorator | TFunction {
  const decorate = (target: TFunction) => {
    log(`@External ${target.name}`);
    addKnownExternal(target);

    const constructor = function (this: any, ...args: any[]): any {
      return (target as any).__tsdi__.configureExternal(args, target);
    };
    Object.defineProperty(constructor, 'name', {
      value: target.name,
    });
    Object.defineProperty(constructor, '__tsdi__external__', {
      value: target,
    });
    (constructor as any).displayName = target.name;
    Object.getOwnPropertyNames(target)
      .filter(
        (prop) =>
          prop !== 'name' &&
          prop !== 'length' &&
          prop !== 'caller' &&
          prop !== 'callee' &&
          prop !== 'arguments' &&
          !(constructor as any)[prop]
      )
      .forEach((prop) => ((constructor as any)[prop] = (target as any)[prop]));
    constructor.prototype = target.prototype;
    return constructor as any;
  };

  if (args.length > 0) {
    return decorate(args[0]);
  }
  return function (target: TFunction): TFunction {
    return decorate(target);
  } as ClassDecorator;
}
export const external = External;
