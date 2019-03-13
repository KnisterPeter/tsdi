import debug from './debug';
import { getNamedOptions } from './helper';
import {
  Constructable,
  IInjectOptions,
  InjectMetadata,
  ParameterMetadata
} from './tsdi';

const log = debug('tsdi');

export function Inject(
  target: object,
  propertyKey: string | symbol,
  parameterIndex?: number
): void;
export function Inject(
  optionsOrString?: IInjectOptions | string
): PropertyDecorator & ParameterDecorator;
export function Inject(
  ...args: any[]
): PropertyDecorator & ParameterDecorator | void {
  const defaultOptions = (optionsOrString?: IInjectOptions | string) => {
    const options = getNamedOptions<IInjectOptions>(optionsOrString || {});
    if (options.lazy === undefined) {
      options.lazy = true;
    }
    return options;
  };
  const decorateProperty = (
    target: object,
    propertyKey: string | symbol,
    options: IInjectOptions
  ) => {
    log(`@Inject ${(target.constructor as any).name}#${String(propertyKey)}`);
    const type: Constructable<any> = Reflect.getMetadata(
      'design:type',
      target,
      propertyKey
    );
    let injects: InjectMetadata[] = Reflect.getMetadata(
      'component:injects',
      target
    );
    if (!injects) {
      injects = [];
      Reflect.defineMetadata('component:injects', injects, target);
    }
    injects.push({
      target,
      property: propertyKey.toString(),
      options,
      type
    });
  };
  const decorateParameter = (
    target: object,
    propertyKey: string | symbol,
    parameterIndex: number,
    options: IInjectOptions
  ) => {
    log(`@Inject ${String(propertyKey)}`);
    let parameters: ParameterMetadata[] = Reflect.getMetadata(
      'component:parameters',
      target
    );
    if (!parameters) {
      parameters = [];
      Reflect.defineMetadata('component:parameters', parameters, target);
    }
    const designParamtypes = Reflect.getMetadata('design:paramtypes', target);
    if (designParamtypes) {
      parameters.push({
        options,
        index: parameterIndex,
        rtti: designParamtypes[parameterIndex]
      });
    }
  };

  if (args.length > 1) {
    const options = defaultOptions({});
    if (typeof args[2] === 'undefined') {
      decorateProperty(args[0], args[1], options);
    } else {
      decorateParameter(args[0], args[1], args[2], options);
    }
    return;
  }
  return function(
    target: object,
    propertyKey: string | symbol,
    parameterIndex?: number
  ): void {
    const options = defaultOptions(args[0] || {});
    if (typeof parameterIndex === 'undefined') {
      return decorateProperty(target, propertyKey, options);
    } else {
      return decorateParameter(target, propertyKey, parameterIndex, options);
    }
  };
}
export const inject = Inject;
