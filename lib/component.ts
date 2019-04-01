import { debug } from './debug';
import { addKnownComponent } from './global-state';
import { getNamedOptions } from './helper';
import { addTsdiMarker } from './marker';
import { IComponentOptions } from './tsdi';

const log = debug('tsdi');

export function Component(
  optionsOrString?: IComponentOptions | string
): ClassDecorator;
export function Component<TFunction extends object>(
  target: TFunction
): TFunction;
export function Component<TFunction extends object>(
  ...args: any[]
): ClassDecorator | TFunction {
  const decorate = (
    target: TFunction,
    optionsOrString: IComponentOptions | string = {}
  ) => {
    log(`@Component ${(target as any).name}`);
    addTsdiMarker(target);
    const options = getNamedOptions<IComponentOptions>(optionsOrString);
    addKnownComponent({
      fn: target as any,
      options
    });
    if (Reflect.defineMetadata) {
      Reflect.defineMetadata('component:options', options, target);
    }
    return target;
  };

  if (args.length === 1 && typeof args[0] === 'function') {
    return decorate(args[0], {});
  }
  return function(target: TFunction): TFunction {
    return decorate(target, args[0] || {});
  } as ClassDecorator;
}
