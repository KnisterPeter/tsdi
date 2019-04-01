import { debug } from './debug';
import { addKnownComponent } from './global-state';
import { addTsdiMarker } from './marker';
import { IFactoryOptions } from './tsdi';

const log = debug('tsdi');

export function Factory(target: object, propertyKey: string): void;
export function Factory(options?: IFactoryOptions): MethodDecorator;
export function Factory(...args: any[]): MethodDecorator | void {
  const decorate = (
    target: object,
    propertyKey: string | symbol,
    options: IFactoryOptions
  ) => {
    if (log.enabled) {
      log(
        '@Factory %s#%s({name: "%s"})',
        (target.constructor as any).name,
        propertyKey,
        (target as any)[propertyKey].name
      );
    }
    const rtti = Reflect.getMetadata('design:returntype', target, propertyKey);
    if (rtti) {
      addTsdiMarker(rtti);
    } else {
      console.warn(
        `Unable to get return type of ${
          (target as any).name
        }#${propertyKey.toString()}(); In order to use @factory you need to emit metadata ` +
          '(see https://tsdi.js.org/docs/en/getting-started.html#compiler-configuration)'
      );
    }
    addKnownComponent({
      target,
      property: propertyKey.toString(),
      options,
      rtti
    });
  };

  if (args.length > 1) {
    return decorate(args[0], args[1], {});
  }
  const options = args[0] || {};
  return function(target: object, propertyKey: string | symbol): void {
    decorate(target, propertyKey, options);
  };
}
