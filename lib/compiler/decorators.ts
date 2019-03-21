import { addTsdiMarker } from '../marker';
import { TSDI } from '../tsdi';

export function managed(configuration: { by: any }): ClassDecorator;
export function managed<T extends { new (...args: any[]): {} }>(
  constructor: T
): T;
export function managed(configuration: {
  lazy?: boolean;
}): (proto: any, prop: string) => void;
export function managed(proto: any, prop: string): void;
export function managed(target: any, prop?: string): any {
  const decorator = (by: any, target: any, prop?: string) => {
    // handle decorated property
    if (target && prop) {
      return undefined;
    }

    // handle decorated class
    addTsdiMarker(target);
    const constructor = function InjectedConstructor(...args: any[]): any {
      const instance = new target(...args);
      if (by || !TSDI.creating) {
        TSDI.creating = false;
        TSDI.getContainer(by).injectExternal(
          instance,
          constructor,
          target.name
        );
      }
      return instance;
    };
    Object.setPrototypeOf
      ? Object.setPrototypeOf(constructor, target)
      : ((constructor as any).__proto__ = target);
    constructor.prototype = target.prototype;
    return constructor as any;
  };

  // target is constructor/function
  if (typeof target === 'function') {
    return decorator(undefined, target, prop);
  }
  const by = target.by;
  return function(target: any, prop?: string): any {
    return decorator(by, target, prop);
  };
}

export function meta(_options: {
  singleton?: boolean;
  scope?: string;
  eager?: boolean;
}): any {
  return () => undefined;
}

export function provides(target: object, propertyKey: string): void;
/**
 * @deprecated
 */
export function provides(_option?: { singleton?: boolean }): MethodDecorator;
export function provides(_option?: { singleton?: boolean }): MethodDecorator {
  return () => undefined;
}

export function unit(target: any): void {
  addTsdiMarker(target);
}

export function container(config: { units: any[] }): ClassDecorator;
// tslint:disable-next-line:ban-types
export function container<T extends Function>(target: T): void;
export function container(config: any): ClassDecorator | void {
  if (typeof config !== 'function') {
    return () => undefined;
  }
}

export function afterConstruct(target: object, propertyKey: string): void;
export function afterConstruct(): MethodDecorator;
export function afterConstruct(): MethodDecorator | void {
  return () => undefined;
}

export function beforeDestroy(target: object, propertyKey: string): void;
export function beforeDestroy(): MethodDecorator;
export function beforeDestroy(): MethodDecorator | void {
  return () => undefined;
}
