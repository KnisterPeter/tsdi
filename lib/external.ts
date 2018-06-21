import { addKnownExternal } from './global-state';

import * as debug from 'debug';
import { TSDI } from './tsdi';
const log = debug('tsdi');

// tslint:disable-next-line:ban-types
export function External<TFunction extends Function>(
  target: TFunction
): TFunction;
export function External(): ClassDecorator;
// tslint:disable-next-line:ban-types
export function External<TFunction extends Function>(
  target?: TFunction
): ClassDecorator | TFunction {
  const decorate = (target: TFunction) => {
    log(`@External ${target.name}`);
    addKnownExternal(target);
    const constructor = function InjectedConstructor(
      this: any,
      ...args: any[]
    ): any {
      return TSDI.externalContainerResolver().configureExternal(args, target);
    };
    Object.setPrototypeOf
      ? Object.setPrototypeOf(constructor, target)
      : ((constructor as any).__proto__ = target);
    constructor.prototype = target.prototype;
    return constructor as any;
  };

  if (target) {
    return decorate(target);
  }
  return function(target: TFunction): TFunction {
    return decorate(target);
  } as ClassDecorator;
}
export const external = External;
