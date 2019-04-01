import {
  Component,
  component,
  destroy,
  external,
  Factory,
  factory,
  Initialize,
  initialize,
  Inject,
  inject,
  TSDI
} from '../lib';
import '../lib/compat';
import { Cyclic1 } from './cyclic1';
import { Dependency } from './dependency';
import { EagerComponent1 } from './eager1';
import { EagerComponent2 } from './eager2';
import { User } from './user';

describe('TSDI', () => {
  describe('when creating a container instance', () => {
    let tsdi: TSDI;

    beforeEach(() => {
      tsdi = new TSDI();
    });

    afterEach(() => {
      tsdi.close();
    });

    it('should warn if create two instances with same criteria', done => {
      let tsdi2: TSDI | undefined;

      const consoleWarn = console.warn;
      try {
        console.warn = function(msg: string): void {
          expect(msg).toBe('Already existing TSDI criteria');
          done();
        };

        tsdi2 = new TSDI();
      } finally {
        console.warn = consoleWarn;
        if (tsdi2) {
          tsdi2.close();
        }
      }
    });

    it('a returned component should be of the requested instance', () => {
      tsdi.register(User);
      tsdi.register(Dependency);
      const user: User = tsdi.get(User);
      expect(user instanceof User).toBeTruthy();
    });

    it('a returned instance should have all dependencies satisfied', () => {
      tsdi.register(User);
      tsdi.register(Dependency);
      const user: User = tsdi.get(User);

      expect(user.method()).toBe('hello');
    });

    it('two returned instances should have the same dependency instances', () => {
      tsdi.register(User);
      tsdi.register(Dependency);
      const user1: User = tsdi.get(User);
      const user2: User = tsdi.get(User);

      expect(user1.getDep()).toBe(user2.getDep());
    });

    it('a returned instance should call decorated lifecycle methods when available', () => {
      tsdi.register(User);
      tsdi.register(Dependency);
      const user: User = tsdi.get(User);

      expect(user.initResult()).toBe('init');
    });

    it('enabling componentScanner should add all known components to the container', () => {
      tsdi.enableComponentScanner();

      const user: User = tsdi.get(User);

      expect(user).toBeInstanceOf(User);
    });

    it('a container with enabled componentScanner should lazy register components', () => {
      tsdi.enableComponentScanner();

      @component()
      class Late {}

      const late: Late = tsdi.get(Late);

      expect(late).toBeInstanceOf(Late);
    });

    it('components could registered by name', () => {
      class A {}
      @Component()
      class B extends A {}

      tsdi.register(A);
      tsdi.register(B, 'Foo');
      expect(tsdi.get(A, 'Foo')).toBe(tsdi.get(B));
    });

    it('components could registered with metadata', () => {
      class A {}
      @Component({ name: 'RegisteredWithMetadata' })
      class B extends A {}

      tsdi.register(A);
      tsdi.register(B);
      expect(tsdi.get(A, 'RegisteredWithMetadata')).toBe(tsdi.get(B));
    });

    it('components could be queried by name', () => {
      @Component()
      class A {
        public m(): string {
          return 'a';
        }
      }
      tsdi.register(A);

      @Component()
      class BExtendsA extends A {
        public m(): string {
          return 'b';
        }
      }
      tsdi.register(BExtendsA);

      @Component({ name: 'Foo' })
      class CExtendsA extends A {
        public m(): string {
          return 'c';
        }
      }
      tsdi.register(CExtendsA);

      @Component({ name: 'Bar' })
      class DExtendsA extends A {
        @inject({ name: 'Foo' })
        private readonly a!: A;

        public m(): string {
          return this.a.m();
        }
      }
      tsdi.register(DExtendsA);

      expect(tsdi.get(A, 'Bar').m()).toBe('c');
    });

    it('should warn if register component with duplicate name', done => {
      class A {}
      class B {}

      const consoleWarn = console.warn;
      try {
        console.warn = function(msg: string): void {
          expect(msg).toBe(
            "Component with name 'DuplicateComponentName' already registered."
          );
          done();
        };
        tsdi.register(A, 'DuplicateComponentName');
        tsdi.register(B, 'DuplicateComponentName');
      } finally {
        console.warn = consoleWarn;
      }
    });

    it('should inject defined properties', () => {
      @Component()
      class ComponentWithProperties {
        @Inject({ name: 'prop' })
        private readonly _prop!: boolean;

        public get prop(): boolean {
          return this._prop;
        }
      }
      tsdi.addProperty('prop', false);
      tsdi.register(ComponentWithProperties);
      expect(tsdi.get(ComponentWithProperties).prop).toBeFalsy();
    });

    it('should throw if requried component was not found', () => {
      @Component()
      class NonRegisteredComponent {}
      try {
        tsdi.get(NonRegisteredComponent);
        fail('Should throw');
      } catch (e) {
        expect(e.message).toBe("Component 'NonRegisteredComponent' not found");
      }
    });

    it('should add itself to the component list', () => {
      tsdi.enableComponentScanner();

      @Component()
      class ComponentWithContainerDependency {
        @Inject private readonly _tsdi!: TSDI;

        public get prop(): TSDI {
          return this._tsdi;
        }
      }
      expect(tsdi.get(ComponentWithContainerDependency).prop).toBe(tsdi);
    });

    it('should call the initalizer', () => {
      tsdi.enableComponentScanner();

      let called = false;

      @Component()
      class ComponentWithInitializer {
        @Initialize
        protected init(): void {
          called = true;
        }
      }
      tsdi.get(ComponentWithInitializer);

      expect(called).toBeTruthy();
    });

    it('should inject annotated constructor parameters', () => {
      tsdi.enableComponentScanner();

      @Component
      class ConstructorParameterComponent {}

      @Component
      class ComponentWithConstructor {
        private readonly _tsdi: TSDI;
        public b: ConstructorParameterComponent;

        constructor(
          @Inject() container: TSDI,
          @Inject b: ConstructorParameterComponent
        ) {
          this._tsdi = container;
          this.b = b;
        }

        public get prop(): TSDI {
          return this._tsdi;
        }
      }

      expect(tsdi.get(ComponentWithConstructor).prop).toBe(tsdi);
      expect(tsdi.get(ComponentWithConstructor).b).toBeInstanceOf(
        ConstructorParameterComponent
      );
    });

    it('should inject annotated constructor parameters during register', () => {
      @Component
      class ConstructorParameterComponent {}
      tsdi.register(ConstructorParameterComponent);

      @Component
      class ComponentWithConstructor {
        private readonly _tsdi: TSDI;
        public b: ConstructorParameterComponent;

        constructor(
          @Inject() container: TSDI,
          @Inject b: ConstructorParameterComponent
        ) {
          this._tsdi = container;
          this.b = b;
        }

        public get prop(): TSDI {
          return this._tsdi;
        }
      }
      tsdi.register(ComponentWithConstructor);

      expect(tsdi.get(ComponentWithConstructor).prop).toBe(tsdi);
      expect(tsdi.get(ComponentWithConstructor).b).toBeInstanceOf(
        ConstructorParameterComponent
      );
    });

    it('should create a new instance for non-singletons', () => {
      tsdi.enableComponentScanner();

      @Component({ singleton: false })
      class NonSingletonComponent {}

      expect(tsdi.get(NonSingletonComponent)).not.toBe(
        tsdi.get(NonSingletonComponent)
      );
    });

    it('should register factories on components', () => {
      tsdi.enableComponentScanner();

      class NonSingletonObject {}

      @Component()
      // @ts-ignore
      class FactoryComponentWithSingletonFactory {
        @factory
        public someFactory(): NonSingletonObject {
          return new NonSingletonObject();
        }
      }

      expect(tsdi.get(NonSingletonObject)).toBeInstanceOf(NonSingletonObject);
      expect(tsdi.get(NonSingletonObject)).toBe(tsdi.get(NonSingletonObject));
    });

    it('should return a new component on each call for non singleton factories', () => {
      tsdi.enableComponentScanner();

      class NonSingletonObject {}

      @Component()
      // @ts-ignore
      class FactoryComponentWithNonSingletonFactory {
        @Factory({ singleton: false })
        public someFactory(): NonSingletonObject {
          return new NonSingletonObject();
        }
      }

      expect(tsdi.get(NonSingletonObject)).toBeInstanceOf(NonSingletonObject);
      expect(tsdi.get(NonSingletonObject)).not.toBe(
        tsdi.get(NonSingletonObject)
      );
    });

    it('inject should fallback to typename if no explicit name given', () => {
      tsdi.enableComponentScanner();

      @Component()
      class InjectedComponent {}

      @Component()
      class ComponentWithNonNamedInject {
        @Inject() private readonly _comp!: InjectedComponent;
        get comp(): InjectedComponent {
          return this._comp;
        }
      }

      expect(tsdi.get(ComponentWithNonNamedInject).comp).toBe(
        tsdi.get(InjectedComponent)
      );
    });

    it('should report an error if named injection could not resolve to a component', () => {
      tsdi.enableComponentScanner();

      @Component()
      class UnknownComponent {}

      @Component()
      class ComponentWithNamedInject {
        @Inject('unknown') private readonly _comp!: UnknownComponent;
        get comp(): UnknownComponent {
          return this._comp;
        }
      }

      expect(() => tsdi.get(ComponentWithNamedInject).comp).toThrow(
        "Component named 'unknown' not found"
      );
    });

    it.skip('should report an error for a probable cyclic dependency', () => {
      tsdi.enableComponentScanner();
      expect(() => tsdi.get(Cyclic1)).toThrow(/Probably a cyclic dependency/);
    });

    it('should get a component by hint/name only', () => {
      tsdi.enableComponentScanner();

      @Component('Component')
      class NamedComponent {}

      expect(tsdi.get('Component')).toBeInstanceOf(NamedComponent);
    });

    it('should report an error duplicate named component', () => {
      try {
        @Component('Component')
        class NamedComponent1 {}
        tsdi.register(NamedComponent1);

        @Component('Component')
        class NamedComponent2 {}
        tsdi.register(NamedComponent2);

        fail('Should throw error');
      } catch (e) {
        expect(e.message).toMatch(
          /Duplicate name 'Component' for known Components/
        );
      }
    });

    it('should lazy create an inject dependencies', () => {
      tsdi.enableComponentScanner();

      @Component()
      class Injected {}

      @Component()
      class ComponentWithLazyInjection {
        @Inject({ lazy: true })
        public dependency!: Injected;
      }

      const component = tsdi.get(ComponentWithLazyInjection);
      const instances = (tsdi as any).instances;
      const injected = Object.keys(instances)
        .map((key: string) => instances[key])
        .filter(instance => instance instanceof Injected);
      expect(injected).toHaveLength(0);
      expect(component.dependency).toBeTruthy();
    });

    it('should create eager components as soon as possible', done => {
      let count = 0;

      @component({ eager: true })
      class EagerComponent {
        @initialize
        public init(): void {
          count++;
        }
      }
      tsdi.register(EagerComponent);

      setTimeout(() => {
        expect(count).toBe(1);
        done();
      }, 1);
    });

    it('should respect dependency tree for eager creation', done => {
      tsdi.enableComponentScanner();

      const eager1 = tsdi.get(EagerComponent1);
      const eager2 = tsdi.get(EagerComponent2);

      setTimeout(() => {
        expect(eager1.dependency).toBe(eager2);
        done();
      }, 1);
    });

    it('should call lifecycle listener on component creation', () => {
      tsdi.enableComponentScanner();
      let count = 0;

      @component
      class Component {}
      tsdi.addLifecycleListener({
        onCreate(component: any): void {
          if (component instanceof Component) {
            count++;
          }
        }
      });
      tsdi.get(Component);

      expect(count).toBe(1);
    });

    it('should call lifecycle listener on component destruction', () => {
      tsdi.enableComponentScanner();
      let count = 0;

      @component
      class Component {}
      tsdi.addLifecycleListener({
        onDestroy(component: any): void {
          if (component instanceof Component) {
            count++;
          }
        }
      });
      tsdi.get(Component);
      tsdi.close();

      expect(count).toBe(1);
    });

    it('should allow overriding a dependency', () => {
      tsdi.enableComponentScanner();

      @component
      class Component {
        public foo(): string {
          return 'foo';
        }
      }

      class ComponentOverride {
        public foo(): string {
          return 'foo-override';
        }
      }
      tsdi.override(Component, new ComponentOverride());

      expect(tsdi.get(Component).foo()).toBe('foo-override');
    });

    it('should call destructor on container close', () => {
      let calledDestructor = false;

      @component
      class ComponentWithDestructor {
        @destroy
        public foo(): void {
          calledDestructor = true;
        }
      }

      tsdi.enableComponentScanner();
      tsdi.get(ComponentWithDestructor);
      tsdi.close();

      expect(calledDestructor).toBeTruthy();
    });

    it('should not fail if destructor is removed', () => {
      let destructorCalled = false;

      @component
      class ComponentWithDestructor {
        @destroy()
        public foo(): void {
          destructorCalled = true;
        }
      }

      tsdi.enableComponentScanner();
      tsdi.override(ComponentWithDestructor, {});
      tsdi.get(ComponentWithDestructor);
      tsdi.close();

      expect(destructorCalled).toBeFalsy();
    });

    it('should re-resolve dependency if injected as dynamic  one', () => {
      @component({ scope: 're-resolve' })
      class Dependency {
        public value = 1;
      }

      @component
      class Dependent {
        @inject({ dynamic: true })
        public dependency!: Dependency;

        // lazy=false is ignored here, proxy is always lazy
        @inject({ lazy: false, dynamic: true })
        public eagerDependency!: Dependency;
      }

      tsdi.enableComponentScanner();
      tsdi.getScope('re-resolve').enter();
      const dependent = tsdi.get(Dependent);
      const dependency1 = dependent.dependency;
      const eagerDependency1 = dependent.eagerDependency;

      tsdi.getScope('re-resolve').leave();
      tsdi.getScope('re-resolve').enter();
      const dependency2 = dependent.dependency;
      const eagerDependency2 = dependent.eagerDependency;

      expect(dependency1).not.toBe(dependency2);
      expect(eagerDependency1).not.toBe(eagerDependency2);
    });

    it('should throw if use unavailable dependency injected as dynamic one', () => {
      @component({ scope: 'scope' })
      class Dependency {
        public value = 1;
      }

      @component
      class Dependent {
        @inject({ dynamic: true })
        public dependency!: Dependency;
      }

      tsdi.enableComponentScanner();
      const dependent = tsdi.get(Dependent);

      expect(() => dependent.dependency.value).toThrow(
        "Component 'Dependency' not found: required scope 'scope' is not enabled"
      );
    });

    describe('with asynchronous initializers', () => {
      it('should call the initializer after multiple async dependencies are initialized', done => {
        let testValue: number | undefined;

        @component
        class DeepNestedAsyncDependency {
          public value?: number;

          @initialize
          protected async init(): Promise<void> {
            return new Promise<void>(resolve => {
              setTimeout(() => {
                this.value = 10;
                resolve();
              }, 100);
            });
          }
        }
        tsdi.register(DeepNestedAsyncDependency);

        @component
        class SyncDependency {
          @inject public dependency!: DeepNestedAsyncDependency;
          public value?: number;

          @initialize
          protected init(): void {
            expect(this.dependency.value).toBe(10);
            this.value = 10;
          }
        }
        tsdi.register(SyncDependency);

        @component({ eager: true })
        class Dependent {
          @inject public dependency!: SyncDependency;

          @initialize
          protected init(): void {
            testValue = 10;
          }
        }
        tsdi.register(Dependent);

        setTimeout(() => {
          expect(testValue).toBe(10);
          done();
        }, 200);
      });

      it('should call the initializer after  async dependencies w/o initializers are initialized', done => {
        let testValue: number | undefined;

        @component
        class DeepNestedAsyncDependency {
          public value?: number;

          @initialize
          protected async init(): Promise<void> {
            return new Promise<void>(resolve => {
              setTimeout(() => {
                this.value = 10;
                resolve();
              }, 100);
            });
          }
        }
        tsdi.register(DeepNestedAsyncDependency);

        @component
        class SyncDependency {
          @inject public dependency!: DeepNestedAsyncDependency;
        }
        tsdi.register(SyncDependency);

        @component({ eager: true })
        class Dependent {
          @inject public dependency!: SyncDependency;

          @initialize
          protected init(): void {
            testValue = 10;
          }
        }
        tsdi.register(Dependent);

        setTimeout(() => {
          expect(testValue).toBe(10);
          done();
        }, 200);
      });

      it('should call the initalizer if all injections are itself initialized', done => {
        let testValue: number | undefined;

        @component
        class Dependency {
          public value?: number;
          @initialize
          protected async init(): Promise<void> {
            return new Promise<void>(resolve => {
              setTimeout(() => {
                this.value = 10;
                resolve();
              }, 100);
            });
          }
        }
        tsdi.register(Dependency);

        @component({ eager: true })
        class Dependent {
          @inject private readonly dependency!: Dependency;

          @initialize
          protected init(): void {
            testValue = this.dependency.value;
          }
        }
        tsdi.register(Dependent);

        setTimeout(() => {
          expect(testValue).toBe(10);
          done();
        }, 150);
      });

      it('should throw if async initializer dependency is injected dynamically', () => {
        tsdi.enableComponentScanner();

        @component
        class Dependency {
          public value?: number;
          @initialize
          protected async init(): Promise<void> {
            return new Promise<void>(resolve => {
              setTimeout(() => {
                this.value = 10;
                resolve();
              }, 100);
            });
          }
        }

        @component
        class Dependent {
          @inject({ dynamic: true })
          private readonly dependency!: Dependency;

          @initialize
          protected init(): void {
            fail('Must not be called');
            // tslint:disable-next-line:no-unused-expression
            this.dependency;
          }
        }

        expect(() => tsdi.get(Dependent)).toThrow(
          'Injecting Dependency into Dependent#dependency must not ' +
            'be dynamic since Dependency has an async initializer'
        );
      });

      it('should log warning if get used with async component', done => {
        tsdi.enableComponentScanner();

        @component
        class Component {
          @initialize
          protected async init(): Promise<void> {
            //
          }
        }

        const consoleWarn = console.warn;
        try {
          console.warn = function(msg: string): void {
            // tslint:disable-next-line:prefer-template
            expect(msg).toBe(
              "Component 'Component' is marked as asynchronous. " +
                'It may not be proper initialized when accessed via get()'
            );
            done();
          };

          tsdi.get(Component);
        } finally {
          console.warn = consoleWarn;
        }
      });
    });

    describe('and scope', () => {
      it('should create components for that scopes', () => {
        tsdi.enableComponentScanner();

        @component({ scope: 'scope' })
        class ComponentWithScope {}

        tsdi.getScope('scope').enter();
        const instance = tsdi.get(ComponentWithScope);

        expect(instance).toBeTruthy();
      });

      it('should throw if scope is not enabled', () => {
        tsdi.enableComponentScanner();

        @component({ scope: 'scope' })
        class ComponentWithScope {}

        expect(() => tsdi.get(ComponentWithScope)).toThrow(
          "Component 'ComponentWithScope' not found: required scope 'scope' is not enabled"
        );
      });

      it('should destroy instances when their scope was left', () => {
        tsdi.enableComponentScanner();

        let destructorCalled = false;

        @component({ scope: 'scope' })
        class ComponentWithScope {
          @destroy
          protected destroy(): void {
            destructorCalled = true;
          }
        }

        tsdi.getScope('scope').enter();
        tsdi.get(ComponentWithScope);
        tsdi.getScope('scope').leave();

        expect(destructorCalled).toBeTruthy();
      });

      it('should keep instances which are out of left scope', () => {
        tsdi.enableComponentScanner();

        let destructorCalled = false;

        @component
        class ComponentWithoutScope {
          @destroy
          protected destroy(): void {
            destructorCalled = true;
          }
        }

        @component({ scope: 'other' })
        class ComponentWithOtherScope {
          @destroy
          protected destroy(): void {
            destructorCalled = true;
          }
        }

        tsdi.getScope('other').enter();
        tsdi.getScope('scope').enter();
        tsdi.get(ComponentWithoutScope);
        tsdi.get(ComponentWithOtherScope);
        tsdi.getScope('scope').leave();

        expect(destructorCalled).toBeFalsy();
      });

      it('should warn user if statically injecting scoped component into unscoped component', done => {
        tsdi.enableComponentScanner();

        // @ts-ignore
        @component({ scope: 'scope' })
        class ComponentToBeInjected {}

        // @ts-ignore
        @component
        class ComponentToInjectTo {
          @inject public dependency!: ComponentToBeInjected;
        }

        const consoleWarn = console.warn;
        try {
          console.warn = function(msg: string): void {
            // tslint:disable-next-line:prefer-template
            expect(msg).toBe(
              "Component 'ComponentToBeInjected' is scoped to 'scope' " +
                "and injected into 'ComponentToInjectTo' without scope. This could easily " +
                "lead to stale references. Consider to add the scope 'scope' to " +
                "'ComponentToInjectTo' as well or make the inject dynamic."
            );
            done();
          };
          tsdi.getScope('scope').enter();
          // tslint:disable-next-line:no-unused-expression
          tsdi.get(ComponentToInjectTo).dependency;
          tsdi.getScope('scope').leave();
        } finally {
          console.warn = consoleWarn;
        }
      });

      it('should not warn about scope issues for external components', () => {
        tsdi.enableComponentScanner();

        // @ts-ignore
        @component({ scope: 'scope' })
        class ComponentToBeInjected {}

        // @ts-ignore
        @external
        class ComponentToInjectTo {
          @inject public dependency!: ComponentToBeInjected;
        }

        const consoleWarn = console.warn;
        try {
          console.warn = function(): void {
            fail();
          };
          tsdi.getScope('scope').enter();
          // tslint:disable-next-line:no-unused-expression
          new ComponentToInjectTo().dependency;
          tsdi.getScope('scope').leave();
        } finally {
          console.warn = consoleWarn;
        }
      });
    });
  });

  describe('without container instance', () => {
    it('a created instance should not have dependencies satisified', () => {
      const comp = new User();
      expect(() => comp.method()).toThrow();
    });

    it('a created instance should have mockable dependencies', () => {
      const comp = new User();
      (comp as any)['dependency'] = {
        echo(): string {
          return 'world';
        }
      };
      expect(comp.method()).toBe('world');
    });
  });
});
