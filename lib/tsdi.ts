import debug from 'debug';
import 'reflect-metadata';
import { managed } from './compiler/decorators';
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
  target: object;
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
  provider?: {
    class: Constructable<any>;
    method: string;
    dependencies: Constructable<any>[];
  };
  constructorDependencies?: Constructable<any>[];
  propertyDependencies?: { property: string; type: Constructable<any> }[];
  initializer?: string;
  disposer?: string;
};

/** @internal */
export type FactoryMetadata = {
  target: object;
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

@managed
export class TSDI {
  /**
   * @internal
   */
  public static creating = false;

  private static containerHolder: { criteria: any; container: TSDI }[] = [];

  private static customExternalContainerResolver = false;
  private static _externalContainerResolver: () => TSDI = () => undefined!;

  /**
   * @internal
   */
  public static getContainer(criteria: any): TSDI {
    const container = this.containerHolder.find(
      container => container.criteria === criteria
    );
    if (!container) {
      if (criteria === undefined) {
        return TSDI.containerHolder[0].container;
      }
      throw new Error(`Failed to get TSDI for '${criteria.name || criteria}'`);
    }
    return container.container;
  }

  public static get externalContainerResolver(): () => TSDI {
    return TSDI._externalContainerResolver;
  }

  public static set externalContainerResolver(fn: () => TSDI) {
    TSDI.customExternalContainerResolver = true;
    TSDI._externalContainerResolver = fn;
  }

  private autoMock: any[] | undefined = undefined;

  private readonly components: ComponentOrFactoryMetadata[] = [];

  private instances: { [idx: number]: any } = {};

  private listener: ComponentListener | undefined;

  private readonly properties: { [key: string]: any } = {};

  private readonly lifecycleListeners: LifecycleListener[] = [];

  private readonly scopes: { [name: string]: boolean } = {};

  constructor(criteria?: any) {
    if (!TSDI.customExternalContainerResolver) {
      TSDI._externalContainerResolver = () => this;
    }

    if (TSDI.containerHolder.find(holder => holder.criteria === criteria)) {
      console.warn('Already existing TSDI criteria', criteria);
    }
    TSDI.containerHolder.push({ criteria, container: this });

    this.configure(TSDI);
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

  private notifyOnDestroy(component: any): void {
    this.lifecycleListeners.forEach(l => {
      if (l.onDestroy) {
        l.onDestroy(component);
      }
    });
  }

  public addProperty(key: string, value: any): void {
    this.properties[key] = value;
  }

  public close(): void {
    Object.keys(this.instances)
      .reverse()
      .forEach(key => {
        const idx = parseInt(key, 10);
        const metadata = this.components[idx];
        if (!metadata) {
          throw new Error('Invalid components ' + idx);
        }
        if (!isFactoryMetadata(metadata)) {
          this.destroyInstance(idx, metadata);
        }
      });
    this.instances = [];

    if (this.listener) {
      removeListener(this.listener);
      this.listener = undefined;
    }

    TSDI.containerHolder = TSDI.containerHolder.filter(
      container => container.container !== this
    );
  }

  private destroyInstance(
    idx: number,
    metadata: ComponentOrFactoryMetadata
  ): void {
    const instance = this.instances[idx];
    if (instance) {
      this.notifyOnDestroy(instance);

      const getDestroyCallback = () => {
        if (!isFactoryMetadata(metadata) && metadata.disposer) {
          return metadata.disposer;
        }
        return Reflect.getMetadata(
          'component:destroy',
          isFactoryMetadata(metadata) ? metadata.rtti : metadata.fn.prototype
        );
      };
      const destroy = getDestroyCallback();

      if (destroy && instance[destroy]) {
        instance[destroy].call(instance);
      }
      this.instances[idx] = undefined;
    }
  }

  public enableComponentScanner(): void {
    if (!this.listener) {
      this.listener = (metadata: ComponentOrFactoryMetadata) => {
        if (isFactoryMetadata(metadata)) {
          this.configure(metadata.rtti, {
            meta: metadata.options,
            provider: {
              class: metadata.target.constructor as any,
              method: metadata.property,
              dependencies: []
            }
          });
        } else {
          const constructorDependencies = this.getConstructorParameterMetadata(
            metadata.fn
          );
          const initializer = Reflect.getMetadata(
            'component:init',
            metadata.fn.prototype
          );

          this.configure(metadata.fn, {
            meta: metadata.options,
            provider: metadata.provider,
            constructorDependencies:
              constructorDependencies || metadata.constructorDependencies,
            propertyDependencies: metadata.propertyDependencies,
            initializer: initializer || metadata.initializer,
            disposer: metadata.disposer
          });
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
          meta => meta.options.name === componentMetadata.options.name
        ) > -1
      ) {
        console.warn(
          `Component with name '${
            componentMetadata.options.name
          }' already registered.`
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
        inject =>
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
    }
  }

  public register(component: Constructable<any>, name?: string): void {
    const options: IComponentOptions =
      Reflect.getMetadata('component:options', component) || {};
    const initializer = Reflect.getMetadata(
      'component:init',
      component.prototype
    );

    // meta here is the fallback to the component options
    this.configure(component, {
      meta: {
        ...options,
        name: name || options.name
      } as any,
      initializer
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
      ((metadata as ComponentMetadata).fn === component ||
        (isFactoryMetadata(metadata) && metadata.rtti === component))
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
    if (!isFactoryMetadata(metadata) && metadata.constructorDependencies) {
      const container = this;
      const get = (dependeny: Constructable<any>) => container.get(dependeny);
      return metadata.constructorDependencies.map(dependeny => {
        return get(dependeny);
      });
    }
    return [];
  }

  private isSingleton(metadata: ComponentOrFactoryMetadata): boolean {
    return (
      typeof metadata.options.singleton === 'undefined' ||
      metadata.options.singleton
    );
  }

  private getOrCreate<T>(metadata: ComponentOrFactoryMetadata, idx: number): T {
    log('> getOrCreate %o', metadata);
    let instance = this.instances[idx] as T;
    if (!instance || !this.isSingleton(metadata)) {
      if (isFactoryMetadata(metadata)) {
        log(
          'create %o from factory with %o',
          (metadata.rtti as any).name,
          metadata.options
        );
        instance = this.get(metadata.target.constructor as Constructable<any>)[
          metadata.property
        ]();
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
    log('create %o with %o', (metadata.fn as any).name, metadata.options);

    const instanciate = () => {
      if (metadata.provider) {
        return this.get(metadata.provider.class)[metadata.provider.method](
          ...metadata.provider.dependencies.map(dependency =>
            this.get(dependency)
          )
        );
      }
      const constructor: Constructable<T> = metadata.fn as any;
      const parameters = this.getConstructorParameters(metadata);
      try {
        TSDI.creating = true;
        return new constructor(...parameters);
      } finally {
        TSDI.creating = false;
      }
    };

    const instance = instanciate();
    // note: This stores an incomplete instance (injects/properties/...)
    // but it allows recursive use of injects
    this.instances[idx] = instance;
    this.injectIntoInstance(instance, false, metadata);
    this.runInitializer(instance, metadata);
    return instance;
  }

  private runInitializer(instance: any, metadata: ComponentMetadata): void {
    const awaiter = this.waitForInjectInitializers(metadata);
    if (metadata.initializer && instance[metadata.initializer]) {
      if (awaiter) {
        this.addInitializerPromise(
          instance,
          awaiter.then(
            () =>
              instance[metadata.initializer!].call(instance) ||
              Promise.resolve()
          )
        );
      } else {
        this.addInitializerPromise(
          instance,
          instance[metadata.initializer].call(instance)
        );
      }
    } else if (awaiter) {
      this.addInitializerPromise(instance, awaiter);
    }
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
        inject =>
          Reflect.getMetadata(
            'component:init:async',
            inject.type.prototype
          ) as boolean
      );
      if (hasAsyncInitializers) {
        return Promise.all(
          injects.map(inject => {
            const [metadata, idx] = this.getInjectComponentMetadata(inject);
            const injectedComponent = this.getOrCreate(metadata, idx);
            return this.getInitializerPromise(injectedComponent);
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

  private getConstructorParameterMetadata(
    component: Constructable<any>
  ): Constructable<any>[] | undefined {
    const parameterMetadata: ParameterMetadata[] = Reflect.getMetadata(
      'component:parameters',
      component
    );
    if (!parameterMetadata) {
      return undefined;
    }
    return parameterMetadata
      .sort((a, b) => a.index - b.index)
      .map(parameter => parameter.rtti);
  }

  public configureExternal<T>(args: any[], target: any): T {
    const constructorDependencies = this.getConstructorParameterMetadata(
      target
    );

    const parameters = this.getConstructorParameters({
      fn: target,
      constructorDependencies,
      options: {}
    });
    const instance = new target(...args, ...parameters);
    this.injectIntoInstance(instance, true, { fn: target, options: {} });
    const init: string = Reflect.getMetadata(
      'component:init',
      target.prototype
    );
    if (init) {
      instance[init].call(instance);
    }
    return instance;
  }

  /**
   * @internal
   */
  public injectExternal(
    instance: any,
    target: any,
    componentName: string
  ): void {
    const idx = this.getComponentMetadataIndex(target);
    const metadata = this.components[idx];
    if (!metadata) {
      this.throwComponentNotFoundError(target, componentName);
    }
    if (isFactoryMetadata(metadata)) {
      throw new Error('Unable to inject into external factory');
    }
    this.injectIntoInstance(instance, true, metadata);
    this.runInitializer(instance, metadata);
  }

  private injectIntoInstance(
    instance: any,
    externalInstance: boolean,
    componentMetadata: ComponentMetadata
  ): void {
    if (componentMetadata.propertyDependencies) {
      const container = this;
      componentMetadata.propertyDependencies.forEach(dependency => {
        Object.defineProperty(instance, dependency.property, {
          configurable: true,
          enumerable: true,
          get(): any {
            return container.get(dependency.type);
          }
        });
      });
    }
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

    if (!isAsyncInjection && (inject.options.lazy || inject.options.dynamic)) {
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
            value
          });
          log(
            'lazy-resolved injected property %s.%s <- %o',
            instance.constructor.name,
            inject.property,
            instance[inject.property]
          );
          return instance[inject.property];
        }
      });
    } else {
      instance[inject.property] = this.getComponentDependency(
        inject,
        componentMetadata,
        externalInstance
      );
    }
  }

  private isAsyncInitializerDependency(inject: InjectMetadata): boolean {
    const [metadata] = this.getInjectComponentMetadata(inject);
    const async = isFactoryMetadata(metadata)
      ? false
      : (Reflect.getMetadata(
          'component:init:async',
          metadata.fn.prototype
        ) as boolean);
    if (async && inject.options.dynamic) {
      throw new Error(
        `Injecting ${inject.type.name} into ${inject.target.constructor.name}#${
          inject.property
        } must not be dynamic since ${
          inject.type.name
        } has an async initializer`
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

  private getInjectComponentMetadata(
    inject: InjectMetadata
  ): [ComponentOrFactoryMetadata, number] {
    let injectIdx = this.getComponentMetadataIndex(
      inject.type,
      inject.options.name
    );
    if (injectIdx === -1) {
      this.checkAndThrowDependencyError(inject);
      injectIdx = this.getComponentMetadataIndex(
        inject.type,
        (inject.type as any).name
      );
    }
    const injectMetadata = this.components[injectIdx];
    if (!injectMetadata) {
      throw new Error(
        `Failed to get inject '${inject.options.name}' for ` +
          `'${(inject.target.constructor as any).name}#${inject.property}'`
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
        `Component '${metadata.fn.name}' is scoped to '${
          metadata.options.scope
        }' ` +
          `and injected into '${
            dependentMetadata.fn.name
          }' without scope. This could easily ` +
          `lead to stale references. Consider to add the scope '${
            metadata.options.scope
          }' to ` +
          `'${dependentMetadata.fn.name}' as well or make the inject dynamic.`
      );
    }
    return this.getOrCreate(metadata, injectIdx);
  }

  private checkAndThrowDependencyError(inject: InjectMetadata): void {
    if (inject.type && inject.options.name) {
      const e = new Error(
        `Injecting undefined type on ${
          (inject.target.constructor as any).name
        }` +
          `#${inject.property}: Component named '${
            inject.options.name
          }' not found`
      );
      log(e);
      log(
        'Known Components: %o',
        this.components.map(
          component =>
            (isFactoryMetadata(component)
              ? (component.rtti as any)
              : (component.fn as any)
            ).name
        )
      );
      throw e;
    }
    if (!inject.type || inject.options.name) {
      const e = new Error(
        `Injecting undefined type on ${
          (inject.target.constructor as any).name
        }` +
          `#${
            inject.property
          }: Probably a cyclic dependency, switch to name based injection`
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
    const instance = this.getOrCreate<T>(metadata, idx);
    if (!isFactoryMetadata(metadata)) {
      const isAsync = Reflect.getMetadata(
        'component:init:async',
        metadata.fn.prototype
      ) as boolean;
      if (isAsync) {
        console.warn(
          `Component '${metadata.fn.name}' is marked as asynchronous. ` +
            `It may not be proper initialized when accessed via get()`
        );
      }
    }
    return instance;
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
            metadata =>
              !isFactoryMetadata(metadata) && metadata.options.scope === name
          )
          .forEach(metadata => {
            const idx = self.getComponentMetadataIndex(
              isFactoryMetadata(metadata) ? metadata.rtti : metadata.fn
            );
            self.destroyInstance(idx, metadata);
          });
      }
    };
  }

  /**
   * This method could be used to statically describe a dependency
   * tree of an application. It states which components are
   * required to be injected into constuctor and properties of
   * a given component.
   *
   * **Note:** All static features require environments with proxy
   * support.
   *
   * @param component The component to describe (and register)
   * @param constructorDependencies The construtor dependencies
   * @param propertyDependencies The property dependencies
   */
  public configure(
    component: Constructable<any>,
    config: {
      provider?: {
        class: Constructable<any>;
        method: string;
        dependencies: Constructable<any>[];
      };
      constructorDependencies?: Constructable<any>[];
      propertyDependencies?: {
        property: string;
        type: Constructable<any>;
      }[];
      meta?: {
        singleton?: boolean;
        scope?: string;
      };
      initializer?: string;
      disposer?: string;
    } = {}
  ): void {
    this.registerComponent({
      fn: component,
      options: config.meta || {},
      provider: config.provider,
      constructorDependencies: config.constructorDependencies,
      propertyDependencies: config.propertyDependencies,
      initializer: config.initializer,
      disposer: config.disposer
    });
  }
}

export { component, Component } from './component';
export { destroy, Destroy } from './destroy';
export { external, External } from './external';
export { factory, Factory } from './factory';
export { initialize, Initialize } from './initialize';
export { inject, Inject } from './inject';
