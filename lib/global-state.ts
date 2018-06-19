import { findIndexOf } from './helper';
import { ComponentOrFactoryMetadata } from './tsdi';

export type ComponentListener = (
  metadataOrExternal: ComponentOrFactoryMetadata | ((...args: any[]) => any)
) => void;

const listeners: ComponentListener[] = [];
const knownComponents: ComponentOrFactoryMetadata[] = [];
const knownExternals: object[] = [];

export function addKnownComponent(metadata: ComponentOrFactoryMetadata): void {
  if (
    metadata.options.name &&
    findIndexOf(
      knownComponents,
      meta => meta.options.name === metadata.options.name
    ) > -1
  ) {
    throw new Error(
      `Duplicate name '${metadata.options.name}' for known Components.`
    );
  }
  knownComponents.push(metadata);
  listeners.forEach(listener => listener(metadata));
}

export function addKnownExternal(external: object): void {
  if (findIndexOf(knownExternals, fn => fn === external) === -1) {
    knownExternals.push(external);
    listeners.forEach(listener => listener(external as any));
  }
}

export function addListener(listener: ComponentListener): void {
  listeners.push(listener);
  knownComponents.forEach(metadata => listener(metadata));
  knownExternals.forEach(external => listener(external as any));
}

export function removeListener(listener: ComponentListener): void {
  const index = listeners.findIndex(l => l === listener);
  listeners.splice(index, 1);
}
