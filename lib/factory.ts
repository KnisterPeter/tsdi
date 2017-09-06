import { addKnownComponent } from './global-state';
import { IFactoryOptions } from './tsdi';

import * as debug from 'debug';
const log = debug('tsdi');

export function Factory(target: Object, propertyKey: string): void;
export function Factory(options?: IFactoryOptions): MethodDecorator;
export function Factory(...args: any[]): MethodDecorator | void {
  const decorate = (target: Object, propertyKey: string, options: IFactoryOptions) => {
    if (log.enabled) {
      log('@Factory %s#%s({name: "%s"})', (target.constructor as any).name, propertyKey,
        (target as any)[propertyKey].name);
    }
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
    decorate(target, propertyKey, options);
  };
}
export const factory = Factory;
