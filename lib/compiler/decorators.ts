export function inject<T extends { new (...args: any[]): {} }>(
  constructor: T
): void;
export function inject(proto: any, prop: string): void;
export function inject(
  _target: any,
  _prop?: string,
  _descr?: PropertyDescriptor
): void {
  //
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
