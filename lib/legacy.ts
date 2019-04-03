import 'reflect-metadata';
import { isFactoryMetadata } from './helper';
import { Constructable, InjectMetadata, TSDI as TSDIBase } from './tsdi';

export type Mock<T> = { -readonly [P in keyof T]: T[P] };

export class TSDI extends TSDIBase {
  private static customExternalContainerResolver = false;
  private static _externalContainerResolver: () => TSDI = () => undefined!;

  public static get externalContainerResolver(): () => TSDI {
    return TSDI._externalContainerResolver;
  }

  public static set externalContainerResolver(fn: () => TSDI) {
    TSDI.customExternalContainerResolver = true;
    TSDI._externalContainerResolver = fn;
  }

  private autoMock: any[] | undefined = undefined;

  private readonly properties = new Map<string, any>();

  constructor(criteria?: any) {
    super(criteria);
    if (!TSDI.customExternalContainerResolver) {
      TSDI._externalContainerResolver = () => this;
    }
  }

  public addProperty(key: string, value: any): void {
    this.properties.set(key, value);
  }

  protected injectProperty(instance: any, inject: InjectMetadata): boolean {
    if (inject.options.name && this.properties.has(inject.options.name)) {
      instance[inject.property] = this.properties.get(inject.options.name);
      return true;
    }
    return false;
  }

  public enableAutomock(...allowedDependencies: any[]): void {
    console.warn(
      '#enableAutomock is deprecated and should not be used. Instead use #override.'
    );
    this.autoMock = allowedDependencies;
  }

  protected injectAutoMock(instance: any, inject: InjectMetadata): boolean {
    if (!this.autoMock) {
      return false;
    }
    const [injectMetadata] = this.getInjectComponentMetadata(inject);
    if (injectMetadata) {
      const constructor = isFactoryMetadata(injectMetadata)
        ? injectMetadata.rtti
        : injectMetadata.fn;
      if (this.autoMock.indexOf(constructor) > -1) {
        return false;
      }
      const automock = this.mock(constructor);
      if (automock) {
        instance[inject.property] = automock;
        return true;
      }
    }
    return false;
  }

  private createAutoMock<T>(constructor: Constructable<T>): T | undefined {
    if (!this.autoMock || this.autoMock.indexOf(constructor) > -1) {
      return undefined;
    }
    const automock = {
      __tsdi__mock__: 'This is a TSDI automock'
    };
    const proto = constructor.prototype;

    Object.keys(Object.getOwnPropertyDescriptors(proto)).forEach(property => {
      if (typeof proto[property] === 'function') {
        (automock as any)[property] = function(...args: any[]): any {
          return args;
        };
      }
    });
    if (automock) {
      return automock as any;
    }
    return undefined;
  }

  public mock<T>(component: Constructable<T>): Mock<T> {
    console.warn(
      '#mock is deprecated and should not be used. Instead use #override.'
    );
    const idx = this.getComponentMetadataIndex(component);
    if (!this.instances[idx]) {
      const mock = this.createAutoMock(component);
      if (!mock) {
        throw new Error(
          `Failed to create mock from ${(component as any).name}`
        );
      }
      this.instances[idx] = mock;
    }
    return this.instances[idx] as T;
  }
}

export { Component as component, Component } from './component';
export { Destroy as destroy, Destroy } from './destroy';
export { External as external, External } from './external';
export { Factory as factory, Factory } from './factory';
export * from './index';
export { Initialize as initialize, Initialize } from './initialize';
export { Inject as inject, Inject } from './inject';
