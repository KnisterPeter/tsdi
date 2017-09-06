import { addKnownComponent } from './global-state';
import { getNamedOptions } from './helper';
import { IComponentOptions } from './tsdi';

import * as debug from 'debug';
const log = debug('tsdi');

export function Component<TFunction extends Function>(target: TFunction): TFunction;
export function Component(optionsOrString?: IComponentOptions | string): ClassDecorator;
export function Component<TFunction extends Function>(...args: any[]): ClassDecorator| TFunction {
  const decorate = (target: TFunction, optionsOrString: IComponentOptions | string = {}) => {
    log(`@Component ${(target as any).name}`);
    const options = getNamedOptions<IComponentOptions>(optionsOrString);
    addKnownComponent({
      fn: target as any,
      options
    });
    Reflect.defineMetadata('component:options', options, target);
    return target;
  };

  if (args.length === 1 && typeof args[0] === 'function') {
    return decorate(args[0], {});
  }
  return function(target: TFunction): TFunction {
    return decorate(target, args[0] || {});
  } as ClassDecorator;
}
export const component = Component;
