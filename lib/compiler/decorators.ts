export function managed<T extends { new (...args: any[]): {} }>(
  constructor: T
): void;
export function managed(proto: any, prop: string): void;
export function managed(
  _target: any,
  _prop?: string,
  _descr?: PropertyDescriptor
): void {
  //
}

export function meta(_options: { singleton?: boolean }): ClassDecorator {
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
