const marker = Symbol();

export function addTsdiMarker(o: any): void {
  Object.defineProperty(o, marker, {
    value: Symbol(),
    configurable: false,
    enumerable: false,
    writable: false
  });
}

export function findTsdiMarker(o: any): any {
  let proto = o;
  while (proto !== null) {
    if (Object.getOwnPropertyDescriptor(proto, marker)) {
      break;
    }
    proto = Object.getPrototypeOf(proto);
  }
  return proto;
}

export function getTsdiMarker(o: any): symbol | undefined {
  const proto = findTsdiMarker(o);
  return proto ? proto[marker] : undefined;
}
