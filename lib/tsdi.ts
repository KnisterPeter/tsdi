import 'reflect-metadata';
import { debug } from './debug';
import { addListener, ComponentListener, removeListener } from './global-state';
import { findIndexOf, isFactoryMetadata } from './helper';

const log = debug('tsdi');

export type Constructable<T> = { new (...args: any[]): T };

export type IComponentOptions = ComponentOptions;
export interface ComponentOptions {
  name?: string;
  singleton?: boolean;
  eager?: boolean;
  scope?: string;
}

export type IInjectOptions = InjectOptions;
export interface InjectOptions {
  name?: string;
  lazy?: boolean;
  dynamic?: boolean;
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

export type Mock<T> = { -readonly [P in keyof T]: T[P] };

export interface LifecycleListener {
  onCreate?(component: any): void;
  onDestroy?(component: any): void;
}

export class TSDI {
  private autoMock: any[] | undefined = undefined;

  private readonly components: ComponentOrFactoryMetadata[] = [];

  private instances: { [idx: number]: Object } = {};

  private listener: ComponentListener | undefined;

  private readonly properties: { [key: string]: any } = {};

  private readonly lifecycleListeners: LifecycleListener[] = [];

  private readonly scopes: { [name: string]: boolean } = {};

  private readonly parent: TSDI | undefined;

  constructor(configuration?: Object, parent?: TSDI) {
    this.registerComponent({
      fn: TSDI,
      options: {},
    });
    this.instances[0] = this;

    if (configuration) {
      this.registerComponent({
        fn: configuration.constructor as Constructable<unknown>,
        options: {},
      });
      this.instances[1] = configuration;
      Object.defineProperty(configuration, '__tsdi__', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: this,
      });

      Object.getOwnPropertyNames(configuration.constructor.prototype)
        .filter((name) =>
          Reflect.getMetadata(
            'component:configured',
            configuration.constructor.prototype,
            name
          )
        )
        .forEach((property) => {
          const rtti = Reflect.getMetadata(
            'design:returntype',
            configuration,
            property
          );
          if (rtti) {
            // method
            this.registerComponent({
              target: configuration,
              property,
              options: {},
              rtti,
            });
          } else {
            const fn = Reflect.getMetadata(
              'design:type',
              configuration,
              property
            );
            if (fn.__tsdi__external__) {
              // external component
              fn.__tsdi__external__.__tsdi__ = this;
            } else {
              // property component
              this.registerComponent({
                fn,
                options: {},
              });
            }
          }
        });
    }
    this.parent = parent;
  }

  public addLifecycleListener(lifecycleListener: LifecycleListener): void {
    this.lifecycleListeners.push(lifecycleListener);
    Object.keys(this.instances).forEach((idx) => {
      this.notifyOnCreate(this.instances[parseInt(idx, 10)]);
    });
  }

  private notifyOnCreate(component: any): void {
    this.lifecycleListeners.forEach((l) => {
      if (l.onCreate) {
        l.onCreate(component);
      }
    });
  }

  private notifyOnDestroy(component: any): void {
    this.lifecycleListeners.forEach((l) => {
      if (l.onDestroy) {
        l.onDestroy(component);
      }
    });
  }

  public addProperty(key: string, value: any): void {
    this.properties[key] = value;
  }

  public close(): void {
    Object.keys(this.instances).forEach((key) => {
      const idx = parseInt(key, 10);
      const metadata = this.components[idx];
      if (!isFactoryMetadata(metadata)) {
        this.destroyInstance(idx, metadata);
      }
    });
    this.instances = [];

    if (this.listener) {
      removeListener(this.listener);
      this.listener = undefined;
    }
  }

  private destroyInstance(
    idx: number,
    metadata: ComponentOrFactoryMetadata
  ): void {
    const instance = this.instances[idx];
    if (instance) {
      this.notifyOnDestroy(instance);

      const destroy = Reflect.getMetadata(
        'component:destroy',
        isFactoryMetadata(metadata) ? metadata.rtti : metadata.fn.prototype
      );
      if (destroy && (instance as any)[destroy]) {
        (instance as any)[destroy].call(instance);
      }
      (this.instances[idx] as any) = undefined;
    }
  }

  public enableComponentScanner(): void {
    if (!this.listener) {
      this.listener = (
        metadataOrExternal: Parameters<ComponentListener>[0]
      ) => {
        if (typeof metadataOrExternal === 'function') {
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

  public enableAutomock(...allowedDependencies: any[]): void {
    console.warn(
      '#enableAutomock is deprecated and should not be used. Instead use #override.'
    );
    this.autoMock = allowedDependencies;
  }

  private registerComponent(
    componentMetadata: ComponentOrFactoryMetadata
  ): void {
    if (this.components.indexOf(componentMetadata) === -1) {
      if (
        componentMetadata.options.name &&
        findIndexOf(
          this.components,
          (meta) => meta.options.name === componentMetadata.options.name
        ) > -1
      ) {
        console.warn(
          `Component with name '${componentMetadata.options.name}' already registered.`
        );
      }

      this.markAsyncInitializer(componentMetadata);

      log(
        'registerComponent %o',
        isFactoryMetadata(componentMetadata)
          ? (componentMetadata.rtti as any).name
          : (componentMetadata.fn as any).name
      );
      this.components.push(componentMetadata);
      if (componentMetadata.options.eager) {
        const idx = this.components.length - 1;
        setTimeout(() => {
          this.getOrCreate(componentMetadata, idx);
        }, 0);
      }
    }
  }

  private markAsyncInitializer(
    componentMetadata: ComponentOrFactoryMetadata
  ): void {
    if (!isFactoryMetadata(componentMetadata)) {
      const isAsync = Reflect.getMetadata(
        'component:init:async',
        componentMetadata.fn.prototype
      ) as boolean;
      const injects: InjectMetadata[] =
        Reflect.getMetadata(
          'component:injects',
          componentMetadata.fn.prototype
        ) || [];
      const hasAsyncInitializers = injects.some(
        (inject) =>
          inject.type &&
          (Reflect.getMetadata(
            'component:init:async',
            inject.type.prototype
          ) as boolean)
      );
      if (!isAsync && hasAsyncInitializers) {
        Reflect.defineMetadata(
          'component:init:async',
          true,
          componentMetadata.fn.prototype
        );
      }
    } else {
      // is the factory async?...
      const isAsync = Reflect.getMetadata(
        'component:init:async',
        componentMetadata.target.constructor.prototype
      ) as boolean;

      // ...then the resulting component is as well!
      Reflect.defineMetadata(
        'component:init:async',
        isAsync,
        componentMetadata.rtti.prototype
      );
    }
  }

  public register(component: Constructable<any>, name?: string): void {
    const options: IComponentOptions =
      Reflect.getMetadata('component:options', component) || {};
    this.registerComponent({
      fn: component,
      options: {
        ...options,
        name: name || options.name,
      },
    });
  }

  private getComponentMetadataIndex(
    component: Constructable<any> | undefined,
    name?: string
  ): number {
    for (let i = 0, n = this.components.length; i < n; i++) {
      if (name) {
        if (name === this.components[i].options.name) {
          return i;
        }
      } else {
        if (
          this.isComponentMetadataIndexFromComponentOrFactory(
            component,
            this.components[i]
          )
        ) {
          return i;
        }
      }
    }
    return -1;
  }

  private isComponentMetadataIndexFromComponentOrFactory(
    component: Constructable<any> | undefined,
    metadata: ComponentOrFactoryMetadata
  ): boolean {
    return (
      typeof component !== 'undefined' &&
      (isFactoryMetadata(metadata) ? metadata.rtti : metadata.fn) === component
    );
  }

  private throwComponentNotFoundError(
    component?: Constructable<any>,
    name?: string,
    additionalInfo?: string
  ): void {
    if (component && !name) {
      name = (component as any).name;
    }
    if (!name) {
      name = 'unknown';
    }
    throw new Error(
      `Component '${name}' not found${
        additionalInfo ? `: ${additionalInfo}` : ''
      }`
    );
  }

  private getConstructorParameters(
    metadata: ComponentOrFactoryMetadata
  ): any[] {
    const parameterMetadata: ParameterMetadata[] = Reflect.getMetadata(
      'component:parameters',
      (metadata as ComponentMetadata).fn
    );
    if (parameterMetadata) {
      return parameterMetadata
        .sort((a, b) => a.index - b.index)
        .map((parameter) => ({
          index: this.getComponentMetadataIndex(
            parameter.rtti,
            parameter.options.name
          ),
        }))
        .map(({ index }) => this.getOrCreate(this.components[index], index));
    }
    return [];
  }

  private isSingleton(metadata: ComponentOrFactoryMetadata): boolean {
    return (
      typeof metadata.options.singleton === 'undefined' ||
      metadata.options.singleton
    );
  }

  private getOrCreateFactory(metadata: FactoryMetadata): any {
    return this.get(metadata.target.constructor as Constructable<any>);
  }

  private hasAsyncFactoryInitializer(metadata: FactoryMetadata): boolean {
    const factory = this.getOrCreateFactory(metadata);
    const awaiter = this.getInitializerPromise(factory);
    return Boolean(awaiter);
  }

  private getOrCreate<T>(metadata: ComponentOrFactoryMetadata, idx: number): T {
    log('> getOrCreate %o', metadata);
    let instance = this.instances[idx] as T;
    if (!instance || !this.isSingleton(metadata)) {
      if (isFactoryMetadata(metadata)) {
        log(
          'create %o from factory with %o',
          metadata.rtti.name,
          metadata.options
        );
        const factory = this.getOrCreateFactory(metadata);
        instance = factory[metadata.property]();
        this.instances[idx] = instance;
      } else {
        instance = this.createComponent(metadata, idx);
      }
      this.notifyOnCreate(instance);
    }
    log('< getOrCreate %o -> %o', metadata, instance);
    return instance;
  }

  private addInitializerPromise(
    instance: any,
    value: Promise<void> | undefined
  ): void {
    if (value) {
      Reflect.defineMetadata('tsdi:initialize:promise', value, instance);
    }
  }

  private getInitializerPromise(instance: any): Promise<void> | undefined {
    return Reflect.getMetadata('tsdi:initialize:promise', instance);
  }

  private createComponent<T>(metadata: ComponentMetadata, idx: number): T {
    if (!this.hasEnteredScope(metadata)) {
      this.throwComponentNotFoundError(
        metadata.fn,
        undefined,
        `required scope '${metadata.options.scope}' is not enabled`
      );
    }
    log('create %o with %o', metadata.fn.name, metadata.options);
    const constructor: Constructable<T> = metadata.fn;
    const parameters = this.getConstructorParameters(metadata);
    const instance = new constructor(...parameters);
    // note: This stores an incomplete instance (injects/properties/...)
    // but it allows recursive use of injects
    this.instances[idx] = instance;
    this.injectIntoInstance(instance, false, metadata);
    const init: string = Reflect.getMetadata(
      'component:init',
      metadata.fn.prototype
    );
    this.maybeLazyInitialize(instance, init, metadata);
    return instance;
  }

  private waitForInjectInitializers(
    metadata: ComponentMetadata
  ): Promise<any> | undefined {
    const injects: InjectMetadata[] = Reflect.getMetadata(
      'component:injects',
      metadata.fn.prototype
    );
    if (injects) {
      const hasAsyncInitializers = injects.some(
        (inject) =>
          Reflect.getMetadata(
            'component:init:async',
            inject.type.prototype
          ) as boolean
      );
      if (hasAsyncInitializers) {
        return Promise.all(
          injects.map((inject) => {
            const [metadata, idx] = this.getInjectComponentMetadata(inject);
            const instance = isFactoryMetadata(metadata)
              ? this.getOrCreateFactory(metadata)
              : this.getOrCreate(metadata, idx);
            return this.getInitializerPromise(instance);
          })
        );
      }
    }
    return undefined;
  }

  private hasEnteredScope(metadata: ComponentMetadata): boolean {
    return (
      !metadata.options.scope ||
      Boolean(metadata.options.scope && this.scopes[metadata.options.scope])
    );
  }

  public configureExternal<T>(args: unknown[], target: any): T {
    const metadata: ComponentMetadata = { fn: target, options: {} };
    const parameters = this.getConstructorParameters({
      fn: target,
      options: {},
    });
    const instance = new target(...args, ...parameters);
    this.injectIntoInstance(instance, true, metadata);

    const init: string = Reflect.getMetadata(
      'component:init',
      target.prototype
    );
    this.maybeLazyInitialize(instance, init, metadata);
    return instance;
  }

  private maybeLazyInitialize(
    instance: any,
    init: string,
    metadata: ComponentMetadata
  ): void {
    const awaiter = this.waitForInjectInitializers(metadata);
    if (init) {
      if (awaiter) {
        this.addInitializerPromise(
          instance,
          awaiter.then(() => instance[init].call(instance) || Promise.resolve())
        );
      } else {
        this.addInitializerPromise(instance, instance[init].call(instance));
      }
    } else if (awaiter) {
      this.addInitializerPromise(instance, awaiter);
    }
  }

  private injectIntoInstance(
    instance: any,
    externalInstance: boolean,
    componentMetadata: ComponentMetadata
  ): void {
    const injects: InjectMetadata[] = Reflect.getMetadata(
      'component:injects',
      componentMetadata.fn.prototype
    );
    if (injects) {
      for (const inject of injects) {
        log('injecting %s.%s', instance.constructor.name, inject.property);
        if (
          inject.options.name &&
          typeof this.properties[inject.options.name] !== 'undefined'
        ) {
          instance[inject.property] = this.properties[inject.options.name];
        } else {
          this.injectDependency(
            instance,
            externalInstance,
            inject,
            componentMetadata
          );
        }
      }
    }
  }

  private injectDependency(
    instance: any,
    externalInstance: boolean,
    inject: InjectMetadata,
    componentMetadata: ComponentMetadata
  ): void {
    if (this.injectAutoMock(instance, inject)) {
      return;
    }

    const isAsyncInjection = this.isAsyncInitializerDependency(inject);

    const notAsyncButLazyOrDynamic = () =>
      !isAsyncInjection && (inject.options.lazy || inject.options.dynamic);

    if (notAsyncButLazyOrDynamic()) {
      const tsdi = this;
      Object.defineProperty(instance, inject.property, {
        configurable: true,
        enumerable: true,
        get(): any {
          log(
            'lazy-resolve injected property %s.%s',
            instance.constructor.name,
            inject.property
          );
          const value = tsdi.getComponentDependency(
            inject,
            componentMetadata,
            externalInstance
          );
          if (inject.options.dynamic) {
            return value;
          }
          Object.defineProperty(instance, inject.property, {
            enumerable: true,
            value,
          });
          log(
            'lazy-resolved injected property %s.%s <- %o',
            instance.constructor.name,
            inject.property,
            instance[inject.property]
          );
          return instance[inject.property];
        },
      });
    } else if (this.isAsyncFactoryInjection(inject)) {
      this.createAsyncFactoryInjection(instance, inject);
    } else {
      instance[inject.property] = this.getComponentDependency(
        inject,
        componentMetadata,
        externalInstance
      );
    }
  }

  private createAsyncFactoryInjection(
    instance: any,
    inject: InjectMetadata
  ): void {
    const [metadata] = this.getInjectComponentMetadata(inject);
    if (!isFactoryMetadata(metadata)) {
      throw new Error(
        'Illegal state: async factory injection without factory metadata'
      );
    }

    const factory = this.getOrCreateFactory(metadata);
    const awaiter = this.getInitializerPromise(factory);
    let ready = false;
    if (awaiter) {
      // tslint:disable-next-line: no-floating-promises
      awaiter.then(() => {
        ready = true;
      });
    }

    Object.defineProperty(instance, inject.property, {
      configurable: true,
      enumerable: true,
      get(): any {
        if (ready) {
          const value = factory[metadata.property]();
          Object.defineProperty(instance, inject.property, {
            enumerable: true,
            value,
          });
          return value;
        }
        throw new Error('Illegal state: need to wait for factory to resolve');
      },
    });
  }

  private isAsyncFactoryInjection(inject: InjectMetadata): boolean {
    const [metadata] = this.getInjectComponentMetadata(inject);
    return isFactoryMetadata(metadata)
      ? this.hasAsyncFactoryInitializer(metadata)
      : false;
  }

  private isAsyncInitializerDependency(inject: InjectMetadata): boolean {
    const [metadata] = this.getInjectComponentMetadata(inject);

    const async = isFactoryMetadata(metadata)
      ? this.hasAsyncFactoryInitializer(metadata)
      : (Reflect.getMetadata(
          'component:init:async',
          metadata.fn.prototype
        ) as boolean);
    if (async && inject.options.dynamic) {
      throw new Error(
        `Injecting ${inject.type.name} into ${inject.target.constructor.name}#${inject.property} must not be dynamic since ${inject.type.name} has an async initializer`
      );
    }
    return async;
  }

  private injectAutoMock(instance: any, inject: InjectMetadata): boolean {
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
      __tsdi__mock__: 'This is a TSDI automock',
    };
    const proto = constructor.prototype;
    Object.getOwnPropertyNames(proto).forEach((property) => {
      if (typeof proto[property] === 'function') {
        (automock as any)[property] = function (...args: any[]): any {
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
        throw new Error(`Failed to create mock from ${component.name}`);
      }
      this.instances[idx] = mock;
    }
    return this.instances[idx] as T;
  }

  private getInjectComponentMetadata(
    inject: InjectMetadata
  ): [ComponentOrFactoryMetadata, number] {
    let injectIdx = this.getComponentMetadataIndex(
      inject.type,
      inject.options.name
    );
    if (injectIdx === -1) {
      this.checkAndThrowDependencyError(inject);
      injectIdx = this.getComponentMetadataIndex(inject.type, inject.type.name);
    }
    const injectMetadata = this.components[injectIdx];
    if (!injectMetadata) {
      if (this.parent) {
        return this.parent.getInjectComponentMetadata(inject);
      }

      throw new Error(
        `Failed to get inject '${
          inject.type.name || inject.options.name
        }' for ` + `'${inject.target.constructor.name}#${inject.property}'`
      );
    }
    return [injectMetadata, injectIdx];
  }

  private getComponentDependency(
    inject: InjectMetadata,
    dependentMetadata: ComponentMetadata,
    noScopeWarning: boolean
  ): any {
    const [metadata, injectIdx] = this.getInjectComponentMetadata(inject);
    if (
      !noScopeWarning &&
      !inject.options.dynamic &&
      !isFactoryMetadata(metadata) &&
      metadata.options.scope &&
      !dependentMetadata.options.scope
    ) {
      // tslint:disable-next-line:prefer-template
      console.warn(
        `Component '${metadata.fn.name}' is scoped to '${metadata.options.scope}' ` +
          `and injected into '${dependentMetadata.fn.name}' without scope. This could easily ` +
          `lead to stale references. Consider to add the scope '${metadata.options.scope}' to ` +
          `'${dependentMetadata.fn.name}' as well or make the inject dynamic.`
      );
    }
    return this.getOrCreate(metadata, injectIdx);
  }

  private checkAndThrowDependencyError(inject: InjectMetadata): void {
    if (inject.type && inject.options.name) {
      const e = new Error(
        `Injecting undefined type on ${inject.target.constructor.name}` +
          `#${inject.property}: Component named '${inject.options.name}' not found`
      );
      log(e);
      log(
        'Known Components: %o',
        this.components.map((component) =>
          isFactoryMetadata(component) ? component.rtti.name : component.fn.name
        )
      );
      throw e;
    }
    if (!inject.type || inject.options.name) {
      const e = new Error(
        `Injecting undefined type on ${inject.target.constructor.name}` +
          `#${inject.property}: Probably a cyclic dependency, switch to name based injection`
      );
      log(e);
      throw e;
    }
  }

  public get<T>(componentOrHint: string | Constructable<T>): T;
  public get<T>(component: Constructable<T>, hint: string): T;
  public get<T>(componentOrHint: Constructable<T> | string, hint?: string): T {
    let component: Constructable<T> | undefined;
    if (typeof componentOrHint === 'string') {
      hint = componentOrHint;
      component = undefined;
    } else {
      component = componentOrHint;
    }
    const idx = this.getComponentMetadataIndex(component, hint);
    const metadata = this.components[idx];
    if (!metadata) {
      if (this.parent) {
        return this.parent.get(componentOrHint);
      }
      this.throwComponentNotFoundError(component, hint);
    }
    return this.getOrCreate<T>(metadata, idx);
  }

  public override(component: Constructable<any>, override: any): void {
    const idx = this.getComponentMetadataIndex(component);
    this.instances[idx] = override;
    log('Override %o with %o', component, override);
  }

  public getScope(name: string): { enter(): void; leave(): void } {
    const self = this;
    return {
      enter(): void {
        self.scopes[name] = true;
      },
      leave(): void {
        delete self.scopes[name];
        self.components
          .filter(
            (metadata) =>
              !isFactoryMetadata(metadata) && metadata.options.scope === name
          )
          .forEach((metadata) => {
            const idx = self.getComponentMetadataIndex(
              isFactoryMetadata(metadata) ? metadata.rtti : metadata.fn
            );
            self.destroyInstance(idx, metadata);
          });
      },
    };
  }
}

export { component, Component } from './component';
export { destroy, Destroy } from './destroy';
export { external, External } from './external';
export { factory, Factory } from './factory';
export { initialize, Initialize } from './initialize';
export { inject, Inject } from './inject';
export { configure, Configure } from './configure';
