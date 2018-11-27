import { TSDI } from '../tsdi';

export function managed(configuration: { by: any }): ClassDecorator;
export function managed<T extends { new (...args: any[]): {} }>(
  constructor: T
): T;
export function managed(proto: any, prop: string): void;
export function managed(
  target: any,
  prop?: string,
  _descr?: PropertyDescriptor
): any {
  const decorator = (by: any, target: any, prop?: string) => {
    // handle decorated property
    if (target && prop) {
      return undefined;
    }

    // handle decorated class
    const constructor = function InjectedConstructor(
      this: any,
      ...args: any[]
    ): any {
      const instance = new target(...args);
      if (by || !TSDI.creating) {
        TSDI.creating = false;
        TSDI.getContainer(by).injectExternal(instance, constructor);
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
}): ClassDecorator {
  return () => undefined;
}

export function provides(_option?: { singleton?: boolean }): MethodDecorator {
  return () => undefined;
}

export function unit(_target: any): void {
  //
}

export function container(_config: { units: any[] }): any {
  return () => undefined;
}

export function initialize(target: object, propertyKey: string): void;
export function initialize(): MethodDecorator;
export function initialize(): MethodDecorator | void {
  return () => undefined;
}

export function destroy(target: object, propertyKey: string): void;
export function destroy(): MethodDecorator;
export function destroy(): MethodDecorator | void {
  return () => undefined;
}
