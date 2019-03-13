export function addTsdiMarker(o: any): void {
  Object.defineProperty(o, '__tsdi_marker__', {
    value: Symbol(),
    configurable: false,
    enumerable: false,
    writable: false
  });
}

export function findTsdiMarker(o: any): any {
  let proto = o;
  while (proto !== null) {
    if (Object.getOwnPropertyDescriptor(proto, '__tsdi_marker__')) {
      break;
    }
    proto = Object.getPrototypeOf(proto);
  }
  return proto;
}

export function getTsdiMarker(o: any): symbol | undefined {
  const proto = findTsdiMarker(o);
  return proto ? proto.__tsdi_marker__ : undefined;
}
