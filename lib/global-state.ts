import { findIndexOf, removeElement } from './helper';
import { ComponentOrFactoryMetadata } from './tsdi';

export type ComponentListener = (
  metadataOrExternal: ComponentOrFactoryMetadata | Function
) => void;

let listeners: ComponentListener[] = [];
const knownComponents: ComponentOrFactoryMetadata[] = [];
const knownExternals: Function[] = [];

export function addKnownComponent(metadata: ComponentOrFactoryMetadata): void {
  if (
    metadata.options.name &&
    findIndexOf(
      knownComponents,
      (meta) => meta.options.name === metadata.options.name
    ) > -1
  ) {
    throw new Error(
      `Duplicate name '${metadata.options.name}' for known Components.`
    );
  }
  knownComponents.push(metadata);
  listeners.forEach((listener) => listener(metadata));
}

export function addKnownExternal(external: Function): void {
  if (!isKnownExternal(external)) {
    knownExternals.push(external);
    listeners.forEach((listener) => listener(external));
  }
}

export function isKnownExternal(external: Function): boolean {
  return findIndexOf(knownExternals, (fn) => fn === external) !== -1;
}

export function addListener(listener: ComponentListener): void {
  listeners.push(listener);
  knownComponents.forEach((metadata) => listener(metadata));
  knownExternals.forEach((external) => listener(external));
}

export function removeListener(listener: ComponentListener): void {
  listeners = removeElement(listeners, (l) => l === listener);
}
