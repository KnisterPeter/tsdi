// tslint:disable: no-implicit-dependencies
import { assert } from 'chai';
import {
  Component,
  component,
  destroy,
  External,
  external,
  Factory,
  factory,
  Initialize,
  initialize,
  Inject,
  inject,
  TSDI
} from '../dist/';
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

    it('a returned component should be of the requested instance', () => {
      tsdi.register(User);
      tsdi.register(Dependency);
      const user: User = tsdi.get(User);
      assert.isTrue(user instanceof User);
    });

    it('a returned instance should have all dependencies satisfied', () => {
      tsdi.register(User);
      tsdi.register(Dependency);
      const user: User = tsdi.get(User);
      assert.equal(user.method(), 'hello');
    });

    it('two returned instances should have the same dependency instances', () => {
      tsdi.register(User);
      tsdi.register(Dependency);
      const user1: User = tsdi.get(User);
      const user2: User = tsdi.get(User);
      assert.equal(user1.getDep(), user2.getDep());
    });

    it('a returned instance should call decorated lifecycle methods when available', () => {
      tsdi.register(User);
      tsdi.register(Dependency);
      const user: User = tsdi.get(User);
      assert.equal(user.initResult(), 'init');
    });

    it('enabling componentScanner should add all known components to the container', () => {
      tsdi.enableComponentScanner();
      const user: User = tsdi.get(User);
      assert.isTrue(user instanceof User);
    });

    it('a container with enabled componentScanner should lazy register components', () => {
      tsdi.enableComponentScanner();

      @component()
      class Late {}

      const late: Late = tsdi.get(Late);
      assert.isTrue(late instanceof Late);
    });

    it('components could registered by name', () => {
      class A {}
      @Component()
      class B extends A {}

      tsdi.register(A);
      tsdi.register(B, 'Foo');
      assert.equal(tsdi.get(A, 'Foo'), tsdi.get(B));
    });

    it('components could registered with metadata', () => {
      class A {}
      @Component({ name: 'RegisteredWithMetadata' })
      class B extends A {}

      tsdi.register(A);
      tsdi.register(B);
      assert.equal(tsdi.get(A, 'RegisteredWithMetadata'), tsdi.get(B));
    });

    it('components could be queried by name', () => {
      tsdi.enableComponentScanner();

      @Component()
      class A {
        public m(): string {
          return 'a';
        }
      }

      @Component()
      // @ts-ignore
      class BExtendsA extends A {
        public m(): string {
          return 'b';
        }
      }

      @Component({ name: 'Foo' })
      // @ts-ignore
      class CExtendsA extends A {
        public m(): string {
          return 'c';
        }
      }

      @Component({ name: 'Bar' })
      // @ts-ignore
      class DExtendsA extends A {
        @inject({ name: 'Foo' })
        private readonly a!: A;

        public m(): string {
          return this.a.m();
        }
      }

      assert.equal(tsdi.get(A, 'Bar').m(), 'c');
    });

    it('should warn if register component with duplicate name', done => {
      class A {}
      class B {}

      const consoleWarn = console.warn;
      try {
        console.warn = function(msg: string): void {
          assert.equal(
            msg,
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
      assert.equal(tsdi.get(ComponentWithProperties).prop, false);
    });

    it('should throw if requried component was not found', () => {
      @Component()
      class NonRegisteredComponent {}
      try {
        tsdi.get(NonRegisteredComponent);
        assert.fail('Should throw');
      } catch (e) {
        assert.equal(e.message, "Component 'NonRegisteredComponent' not found");
      }
    });

    it('should add itself to the component list', () => {
      tsdi.enableComponentScanner();

      @Component()
      class ComponentWithContainerDependency {
        @Inject
        private readonly _tsdi!: TSDI;

        public get prop(): TSDI {
          return this._tsdi;
        }
      }
      assert.strictEqual(tsdi.get(ComponentWithContainerDependency).prop, tsdi);
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

      assert.isTrue(called);
    });

    it('should call the initalizer if all injections are itself initialized', done => {
      // this case test the case with async initializers
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
        @inject private dependency!: Dependency;

        @initialize
        protected init(): void {
          assert.equal(this.dependency.value, 10);
          done();
        }
      }

      // todo: this must throw because Dependent is async
      tsdi.get(Dependent);
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

      assert.strictEqual(tsdi.get(ComponentWithConstructor).prop, tsdi);
      assert.instanceOf(
        tsdi.get(ComponentWithConstructor).b,
        ConstructorParameterComponent
      );
    });

    it('should create a new instance for non-singletons', () => {
      tsdi.enableComponentScanner();

      @Component({ singleton: false })
      class NonSingletonComponent {}

      assert.notEqual(
        tsdi.get(NonSingletonComponent),
        tsdi.get(NonSingletonComponent)
      );
    });

    it('should register factories on components', () => {
      tsdi.enableComponentScanner();

      class NonSingletonObject {}

      // @ts-ignore
      @Component()
      // @ts-ignore
      class FactoryComponentWithSingletonFactory {
        @factory
        public someFactory(): NonSingletonObject {
          return new NonSingletonObject();
        }
      }

      // @Component()
      // class C {}

      assert.instanceOf(tsdi.get(NonSingletonObject), NonSingletonObject);
      assert.strictEqual(
        tsdi.get(NonSingletonObject),
        tsdi.get(NonSingletonObject)
      );
    });

    it('should return a new component on each call for non singleton factories', () => {
      tsdi.enableComponentScanner();

      class NonSingletonObject {}

      // @ts-ignore
      @Component()
      // @ts-ignore
      class FactoryComponentWithNonSingletonFactory {
        @Factory({ singleton: false })
        public someFactory(): NonSingletonObject {
          return new NonSingletonObject();
        }
      }

      assert.instanceOf(tsdi.get(NonSingletonObject), NonSingletonObject);
      assert.notEqual(
        tsdi.get(NonSingletonObject),
        tsdi.get(NonSingletonObject)
      );
    });

    it('inject should fallback to typename if no explicit name given', () => {
      tsdi.enableComponentScanner();

      @Component()
      class InjectedComponent {}

      @Component()
      class ComponentWithNonNamedInject {
        @Inject()
        private readonly _comp!: InjectedComponent;
        get comp(): InjectedComponent {
          return this._comp;
        }
      }

      assert.strictEqual(
        tsdi.get(ComponentWithNonNamedInject).comp,
        tsdi.get(InjectedComponent)
      );
    });

    it('should report an error if named injection could not resolve to a component', () => {
      tsdi.enableComponentScanner();

      @Component()
      class UnknownComponent {}

      @Component()
      class ComponentWithNamedInject {
        @Inject('unknown')
        private readonly _comp!: UnknownComponent;
        get comp(): UnknownComponent {
          return this._comp;
        }
      }

      assert.throws(
        () => tsdi.get(ComponentWithNamedInject).comp,
        "Component named 'unknown' not found"
      );
    });

    it('should report an error for a probable cyclic dependency', () => {
      tsdi.enableComponentScanner();
      assert.throws(() => tsdi.get(Cyclic1), /Probably a cyclic dependency/);
    });

    it('should get a component by hint/name only', () => {
      tsdi.enableComponentScanner();

      @Component('Component')
      class NamedComponent {}

      assert.instanceOf(tsdi.get('Component'), NamedComponent);
    });

    it('should report an error duplicate named component', () => {
      tsdi.enableComponentScanner();

      try {
        @Component('Component')
        // @ts-ignore
        class NamedComponent1 {}

        @Component('Component')
        // @ts-ignore
        class NamedComponent2 {}

        assert.fail('Should throw error');
      } catch (e) {
        assert.match(
          e.message,
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
      assert.lengthOf(injected, 0);
      assert.isDefined(component.dependency);
    });

    it('should create eager components as soon as possible', done => {
      tsdi.enableComponentScanner();
      let count = 0;

      @component({ eager: true })
      // @ts-ignore
      class EagerComponent {
        @initialize
        public init(): void {
          count++;
        }
      }

      setTimeout(() => {
        assert.equal(count, 1);
        done();
      }, 1);
    });

    it('should respect dependency tree for eager creation', done => {
      tsdi.enableComponentScanner();

      const eager1 = tsdi.get(EagerComponent1);
      const eager2 = tsdi.get(EagerComponent2);

      setTimeout(() => {
        assert.strictEqual(eager1.dependency, eager2);
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

      assert.equal(count, 1);
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

      assert.equal(count, 1);
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

      assert.equal(tsdi.get(Component).foo(), 'foo-override');
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

      assert.isTrue(calledDestructor);
    });

    it('should not fail if destructor is removed', () => {
      let destructorCalled = false;

      @component
      class ComponentWithDestructor {
        @destroy
        public foo(): void {
          destructorCalled = true;
        }
      }

      tsdi.enableComponentScanner();
      tsdi.override(ComponentWithDestructor, {});
      tsdi.get(ComponentWithDestructor);
      tsdi.close();

      assert.isFalse(destructorCalled);
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

      assert.notEqual(dependency1, dependency2);
      assert.notEqual(eagerDependency1, eagerDependency2);
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

      assert.throws(
        () => dependent.dependency.value,
        "Component 'Dependency' not found: required scope 'scope' is not enabled"
      );
    });

    describe('with external classes', () => {
      it('should inject dependencies', () => {
        tsdi.enableComponentScanner();

        @Component('user2')
        class User2 extends User {}

        @external
        class ExternalClass {
          @Inject()
          public user!: User;
          @Inject('user2')
          public user2!: User;
        }

        const test = new ExternalClass();
        assert.strictEqual(test.user, tsdi.get(User));
        assert.strictEqual(test.user2, tsdi.get(User2));
      });

      it('should call the initializer', () => {
        tsdi.enableComponentScanner();

        let called = false;
        const fn = () => (called = true);

        @External()
        class ExternalClass {
          @initialize()
          public init(): void {
            fn();
          }
        }

        // tslint:disable-next-line:no-unused-expression
        new ExternalClass();
        assert.isTrue(called);
      });

      it('should inject defined properties', () => {
        tsdi.enableComponentScanner();

        @External()
        class ExternalClass {
          @Inject('prop')
          private readonly _prop!: boolean;

          public get prop(): boolean {
            return this._prop;
          }
        }
        tsdi.addProperty('prop', false);

        assert.equal(new ExternalClass().prop, false);
      });

      it('should allow constructor injection', () => {
        tsdi.enableComponentScanner();

        @External()
        class ExternalClass {
          public injected: User;

          constructor(_value: string, @Inject() user?: User) {
            this.injected = user!;
          }
        }

        assert.equal(new ExternalClass('value').injected, tsdi.get(User));
      });

      it('should keep static methods and properties', () => {
        tsdi.enableComponentScanner();
        const noop = () => console.log('noop');

        @External()
        class ExternalClass {
          public static user = 'test';
          public static noop = noop;
        }

        assert.strictEqual(ExternalClass.user, 'test');
        assert.strictEqual(ExternalClass.noop, noop);
      });

      it('should keep prototype chain correct', () => {
        tsdi.enableComponentScanner();

        class Base {}

        @External()
        class ExternalClass extends Base {}

        assert.instanceOf(new ExternalClass(), Base);
      });
    });

    describe('and scope', () => {
      it('should create components for that scopes', () => {
        tsdi.enableComponentScanner();

        @component({ scope: 'scope' })
        class ComponentWithScope {}

        tsdi.getScope('scope').enter();
        const instance = tsdi.get(ComponentWithScope);

        assert.isDefined(instance);
      });

      it('should throw if scope is not enabled', () => {
        tsdi.enableComponentScanner();

        @component({ scope: 'scope' })
        class ComponentWithScope {}

        assert.throws(
          () => tsdi.get(ComponentWithScope),
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

        assert.isTrue(destructorCalled);
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

        assert.isFalse(destructorCalled);
      });

      it('should warn user if statically injecting scoped component into unscoped component', done => {
        tsdi.enableComponentScanner();

        // @ts-ignore
        @component({ scope: 'scope' })
        class ComponentToBeInjected {}

        // @ts-ignore
        @component
        class ComponentToInjectTo {
          @inject
          public dependency!: ComponentToBeInjected;
        }

        const consoleWarn = console.warn;
        try {
          console.warn = function(msg: string): void {
            // tslint:disable-next-line:prefer-template
            assert.equal(
              msg,
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
          @inject
          public dependency!: ComponentToBeInjected;
        }

        const consoleWarn = console.warn;
        try {
          console.warn = function(): void {
            assert.fail();
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
      const comp: User = new User();
      assert.throw(comp.method);
    });

    it('a created instance should have mockable dependencies', () => {
      const comp: User = new User();
      comp['dependency'] = {
        echo(): string {
          return 'world';
        }
      };
      assert.equal(comp.method(), 'world');
    });
  });
});
