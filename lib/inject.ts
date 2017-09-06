import { getNamedOptions } from './helper';
import {
  IInjectOptions,
  Constructable,
  InjectMetadata,
  ParameterMetadata
} from './tsdi';

import * as debug from 'debug';
const log = debug('tsdi');

export function Inject(target: Object, propertyKey: string | symbol, parameterIndex?: number): void;
export function Inject(optionsOrString?: IInjectOptions | string): PropertyDecorator & ParameterDecorator;
export function Inject(...args: any[]): PropertyDecorator & ParameterDecorator | void {
  const defaultOptions = (optionsOrString?: IInjectOptions | string) => {
    const options = getNamedOptions<IInjectOptions>(optionsOrString || {});
    if (options.lazy === undefined) {
      options.lazy = true;
    }
    return options;
  };
  const decorateProperty = (target: Object, propertyKey: string,
      options: IInjectOptions) => {
    log(`@Inject ${(target.constructor as any).name}#${propertyKey}`);
    const type: Constructable<any> = Reflect.getMetadata('design:type', target, propertyKey);
    let injects: InjectMetadata[] = Reflect.getMetadata('component:injects', target);
    if (!injects) {
      injects = [];
      Reflect.defineMetadata('component:injects', injects, target);
    }
    injects.push({
      target,
      property: propertyKey,
      options,
      type
    });
  };
  const decorateParameter = (target: Object, propertyKey: string | symbol, parameterIndex: number,
      options: IInjectOptions) => {
    log(`@Inject ${propertyKey}`);
    let parameters: ParameterMetadata[] = Reflect.getMetadata('component:parameters', target);
    if (!parameters) {
      parameters = [];
      Reflect.defineMetadata('component:parameters', parameters, target);
    }
    parameters.push({
      options,
      index: parameterIndex,
      rtti: Reflect.getMetadata('design:paramtypes', target)[parameterIndex]
    });
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
  return function(target: Object, propertyKey: string, parameterIndex?: number): void {
    const options = defaultOptions(args[0] || {});
    if (typeof parameterIndex === 'undefined') {
      return decorateProperty(target, propertyKey, options);
    } else {
      return decorateParameter(target, propertyKey, parameterIndex, options);
    }
  };
}
export const inject = Inject;
