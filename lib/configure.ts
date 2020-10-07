import { Constructable, TSDI } from '.';

export function Configure(target: Object, property: string | symbol): any;
export function Configure(): any;
export function Configure(...args: any[]): any {
  const decorate = (
    target: Record<string, Function>,
    property: string | symbol
  ) => {
    Reflect.defineMetadata('component:configured', true, target, property);

    const orig = target[property.toString()];
    const cacheKey = `__tsdi__${property.toString()}__`;

    const methodReturnType = Reflect.getMetadata(
      'design:returntype',
      target,
      property
    );
    const propertyType = Reflect.getMetadata('design:type', target, property);

    function propertyCreator(this: {
      __tsdi__: TSDI;
      [cacheKey: string]: any;
    }): any {
      if (!methodReturnType) {
        return this.__tsdi__.get(propertyType);
      }

      if (cacheKey in this) {
        return this[cacheKey];
      }

      const values = Reflect.getMetadata(
        'design:paramtypes',
        target,
        property
      ).map((param: Constructable<unknown>) => this.__tsdi__.get(param));

      const value = orig.call(this, ...values);
      Object.defineProperty(this, cacheKey, {
        configurable: false,
        enumerable: false,
        writable: false,
        value,
      });
      return value;
    }

    return {
      configurable: true,
      enumerable: true,
      writable: true,
      value: propertyCreator,
    };
  };
  if (args.length > 0) {
    return decorate(args[0], args[1]);
  }
  return (target: Object, property: string | symbol) => {
    return decorate(target as any, property) as any;
  };
}

export { Configure as configure };
