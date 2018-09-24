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

export function meta(): ClassDecorator {
  return () => undefined;
}

export function provides(_target: any, _prop: any): void {
  //
}

export function unit(_target: any): void {
  //
}

export function container(_config: { units: any[] }): any {
  return () => undefined;
}
