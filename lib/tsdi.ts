import 'reflect-metadata';
import {
  ComponentListener,
  addListener,
  removeListener
} from './global-state';
import {
  isFactoryMetadata,
  findIndexOf,
  removeElement
} from './helper';

import * as debug from 'debug';
const log = debug('tsdi');

export type Constructable<T> = { new(...args: any[]): T; };

export type IComponentOptions = ComponentOptions;
export interface ComponentOptions {
  name?: string;
  singleton?: boolean;
  eager?: boolean;
}

export type IInjectOptions = InjectOptions;
export interface InjectOptions {
  name?: string;
  lazy?: boolean;
}

export type IFactoryOptions = FactoryOptions;
export interface FactoryOptions {
  name?: string;
  singleton?: boolean;
  eager?: boolean;
}

/** @internal */
export type InjectMetadata = {
  target: Object;
  property: string;
  options: IInjectOptions;
  type: Constructable<any>;
};

/** @internal */
export type ParameterMetadata = {
  index: number;
  rtti: Constructable<any>;
  options: IInjectOptions;
};

/** @internal */
export type ComponentMetadata = {
  fn: Constructable<any>;
  options: IComponentOptions;
};

/** @internal */
export type FactoryMetadata = {
  target: Object;
  property: string;
  options: IFactoryOptions;
  rtti: Constructable<any>;
};

/** @internal */
export type ComponentOrFactoryMetadata = ComponentMetadata | FactoryMetadata;

export interface LifecycleListener {
  onCreate?(component: any): void;
}

export class TSDI {

  private components: ComponentOrFactoryMetadata[] = [];

  private instances: {[idx: number]: Object} = {};

  private listener: ComponentListener|undefined;

  private properties: {[key: string]: any} = {};

  private lifecycleListeners: LifecycleListener[] = [];

  constructor() {
    this.registerComponent({
      fn: TSDI,
      options: {}
    });
    this.instances[0] = this;
  }

  public addLifecycleListener(lifecycleListener: LifecycleListener): void {
    this.lifecycleListeners.push(lifecycleListener);
    Object.keys(this.instances).forEach(idx => {
      this.notifyOnCreate(this.instances[parseInt(idx, 10)]);
    });
  }

  private notifyOnCreate(component: any): void {
    this.lifecycleListeners.forEach(l => {
      if (l.onCreate) {
        l.onCreate(component);
      }
    });
  }

  public addProperty(key: string, value: any): void {
    this.properties[key] = value;
  }

  public close(): void {
    if (this.listener) {
      removeListener(this.listener);
      this.listener = undefined;
    }
  }

  public enableComponentScanner(): void {
    if (!this.listener) {
      this.listener = (metadataOrExternal: ComponentOrFactoryMetadata | Function) => {
        if (typeof metadataOrExternal === 'function')  {
          (metadataOrExternal as any).__tsdi__ = this;
        } else {
          this.registerComponent(metadataOrExternal);
        }
      };
      if (this.listener) {
        addListener(this.listener);
      }
    }
  }

  private registerComponent(componentMetadata: ComponentOrFactoryMetadata): void {
    if (this.components.indexOf(componentMetadata) === -1) {
      if (componentMetadata.options.name && findIndexOf(this.components,
          meta => meta.options.name === componentMetadata.options.name) > -1) {
        console.warn(`Component with name '${componentMetadata.options.name}' already registered.`);
      }

      log('registerComponent %o', isFactoryMetadata(componentMetadata) ?
        (componentMetadata.rtti as any).name : (componentMetadata.fn as any).name);
      this.components.push(componentMetadata);
      if (componentMetadata.options.eager) {
        const idx = this.components.length - 1;
        setTimeout(() => {
          this.getOrCreate(componentMetadata, idx);
        }, 0);
      }
    }
  }

  public register(component: Constructable<any>, name?: string): void {
    const options: IComponentOptions =  Reflect.getMetadata('component:options', component) || {};
    this.registerComponent({
      fn: component,
      options: {
        ...options,
        name: name || options.name
      }
    });
  }

  private getComponentMetadataIndex(component: Constructable<any> | undefined, name?: string): number {
    for (let i = 0, n = this.components.length; i < n; i++) {
      if (name) {
        if (name === this.components[i].options.name) {
          return i;
        }
      } else {
        if (this.isComponentMetadataIndexFromComponentOrFactory(component, this.components[i])) {
          return i;
        }
      }
    }
    return -1;
  }

  private isComponentMetadataIndexFromComponentOrFactory(component: Constructable<any> | undefined,
      metadata: ComponentOrFactoryMetadata): boolean {
    return typeof component !== 'undefined'
          && ((metadata as ComponentMetadata).fn === component
            || isFactoryMetadata(metadata)
              && metadata.rtti === component);
  }

  private throwComponentNotFoundError(component: Constructable<any> | undefined, name: string | undefined): void {
    if (component && !name) {
      name = (component as any).name;
    }
    if (!name) {
      name = 'unknown';
    }
    throw new Error(`Component '${name}' not found`);
  }

  private getConstructorParameters(metadata: ComponentOrFactoryMetadata): any[] {
    const parameterMetadata: ParameterMetadata[] = Reflect.getMetadata('component:parameters',
      (metadata as ComponentMetadata).fn);
    if (parameterMetadata) {
      return parameterMetadata
        .sort((a, b) => a.index - b.index)
        .map(parameter => ({index: this.getComponentMetadataIndex(parameter.rtti, parameter.options.name), parameter}))
        .map(({index, parameter}) => this.getOrCreate(this.components[index], index));
    }
    return [];
  }

  private isSingleton(metadata: ComponentOrFactoryMetadata): boolean {
    return typeof metadata.options.singleton === 'undefined' || metadata.options.singleton;
  }

  private getOrCreate<T>(metadata: ComponentOrFactoryMetadata, idx: number): T {
    log('> getOrCreate %o', metadata);
    // todo: Use T here
    let instance: any = this.instances[idx];
    if (!instance || !this.isSingleton(metadata)) {
      if (isFactoryMetadata(metadata)) {
        log('create %o from factory with %o', (metadata.rtti as any).name, metadata.options);
        instance = this.get(metadata.target.constructor as Constructable<any>)[metadata.property]();
        this.instances[idx] = instance;
      } else {
        log('create %o with %o', (metadata.fn as any).name, metadata.options);
        const constructor: Constructable<T> =  metadata.fn as any;
        const parameters = this.getConstructorParameters(metadata);
        instance = new constructor(...parameters);
        // note: This stores an incomplete instance (injects/properties/...)
        // but it allows recursive use of injects
        this.instances[idx] = instance;
        this.injectIntoInstance(instance, metadata);
        const init: string = Reflect.getMetadata('component:init', metadata.fn.prototype);
        if (init) {
          (instance[init] as Function).call(instance);
        }
      }
      this.notifyOnCreate(instance);
    }
    log('< getOrCreate %o -> %o', metadata, instance);
    return instance;
  }

  public configureExternal<T>(args: any[], target: any): T {
    const parameters = this.getConstructorParameters({fn: target, options: {}});
    const instance = new target(...args, ...parameters);
    this.injectIntoInstance(instance, {fn: target, options: {}});
    const init: string = Reflect.getMetadata('component:init', target.prototype);
    if (init) {
      instance[init].call(instance);
    }
    return instance;
  }

  private injectIntoInstance(instance: any, componentMetadata: ComponentMetadata): void {
    const injects: InjectMetadata[] = Reflect.getMetadata('component:injects', componentMetadata.fn.prototype);
    if (injects) {
      for (const inject of injects) {
        log('injecting %s.%s', instance.constructor.name, inject.property);
        if (inject.options.name && typeof this.properties[inject.options.name] !== 'undefined') {
          instance[inject.property] = this.properties[inject.options.name];
        } else {
          if (inject.options.lazy) {
            const tsdi = this;
            Object.defineProperty(instance, inject.property, {
              configurable: true,
              enumerable: true,
              get(): any {
                let value = instance[`tsdi$${inject.property}`];
                if (!value) {
                  log('lazy-resolve injected property %s.%s', instance.constructor.name, inject.property);
                  value = tsdi.getComponentDependency(inject);
                  instance[`tsdi$${inject.property}`] = value;
                  log('lazy-resolved injected property %s.%s <- %o', instance.constructor.name, inject.property, value);
                }
                return value;
              }
            });
          } else {
            instance[inject.property] = this.getComponentDependency(inject);
          }
        }
      }
    }
  }

  private getComponentDependency(inject: InjectMetadata): any {
    let injectIdx = this.getComponentMetadataIndex(inject.type, inject.options.name);
    if (injectIdx === -1) {
      this.checkAndThrowDependencyError(inject);
      injectIdx = this.getComponentMetadataIndex(inject.type, (inject.type as any).name);
    }
    const injectMetadata = this.components[injectIdx];
    if (!injectMetadata) {
      throw new Error(`Failed to get inject '${inject.options.name}' for `
        + `'${(inject.target.constructor as any).name}#${inject.property}'`);
    }
    return this.getOrCreate(injectMetadata, injectIdx);
  }

  private checkAndThrowDependencyError(inject: InjectMetadata): void {
    if (inject.type && inject.options.name) {
      const e = new Error(`Injecting undefined type on ${(inject.target.constructor as any).name}`
        + `#${inject.property}: Component named '${inject.options.name}' not found`);
      log(e);
      log('Known Components: %o', this.components.map(component =>
        isFactoryMetadata(component) ? (component.rtti as any).name : (component.fn as any).name));
      throw e;
    }
    if (!inject.type || inject.options.name) {
      const e = new Error(`Injecting undefined type on ${(inject.target.constructor as any).name}`
        + `#${inject.property}: Probably a cyclic dependency, switch to name based injection`);
      log(e);
      throw e;
    }
  }

  public get<T>(componentOrHint: string|Constructable<T>): T;
  public get<T>(component: Constructable<T>, hint: string): T;
  public get<T>(componentOrHint: Constructable<T>|string, hint?: string): T {
    let component: Constructable<T> | undefined;
    if (typeof componentOrHint === 'string') {
      hint = componentOrHint as any;
      component = undefined;
    } else {
      component = componentOrHint;
    }
    const idx = this.getComponentMetadataIndex(component, hint);
    const metadata = this.components[idx];
    if (!metadata) {
      this.throwComponentNotFoundError(component, hint);
    }
    return this.getOrCreate<T>(metadata, idx);
  }

}

export { component, Component } from './component';
export { external, External } from './external';
export { inject, Inject } from './inject';
export { initialize, Initialize } from './initialize';
export { factory, Factory } from './factory';
