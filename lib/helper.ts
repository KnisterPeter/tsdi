import {
  ComponentOrFactoryMetadata,
  FactoryMetadata
} from './tsdi';

export function isFactoryMetadata(metadata: ComponentOrFactoryMetadata): metadata is FactoryMetadata {
  return Boolean((metadata as FactoryMetadata).rtti);
}

export function findIndexOf<T>(list: T[], test: (element: T) => boolean): number {
  let idx = -1;
  for (let i = 0, n = list.length; i < n; i++) {
    if (test(list[i])) {
      idx = i;
    }
  }
  return idx;
}

export function removeElement<T>(list: T[], test: (element: T) => boolean): T[] {
  const idx = findIndexOf(list, test);
  if (idx > -1) {
    return [...list.slice(0, idx), ...list.slice(idx + 1)];
  }
  return list;
}

export function getNamedOptions<T extends {name?: string}>(optionOrString: T | string): T {
  if (typeof optionOrString === 'string') {
    const named = {
      name: optionOrString
    };
    return named as T;
  }
  return optionOrString;
}
