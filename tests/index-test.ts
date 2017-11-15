import { assert } from 'chai';
import 'source-map-support/register';

import {
  TSDI,
  Component,
  component,
  Inject,
  inject,
  Factory,
  factory,
  External,
  external,
  Initialize,
  initialize
} from '../lib/tsdi';
import { Cyclic1 } from './cyclic1';
import { Cyclic2 } from './cyclic2';
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
      class Late {
      }

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
      @Component({name: 'RegisteredWithMetadata'})
      class B extends A {}

      tsdi.register(A);
      tsdi.register(B);
      assert.equal(tsdi.get(A, 'RegisteredWithMetadata'), tsdi.get(B));
    });

    it('components could be queried by name', () => {
      tsdi.enableComponentScanner();

      @Component()
      class A {
        public m(): string { return 'a'; }
      }

      @Component()
      class BExtendsA extends A {
        public m(): string { return 'b'; }
      }

      @Component({name: 'Foo'})
      class CExtendsA extends A {
        public m(): string { return 'c'; }
      }

      @Component({name: 'Bar'})
      class DExtendsA extends A {

        @inject({name: 'Foo'})
        private a: A;

        public m(): string {
          return this.a.m();
        }
      }

      assert.equal(tsdi.get(A, 'Bar').m(), 'c');
    });

    it('should warn if register component with duplicate name', (done: MochaDone) => {
      class A {}
      class B {}

      const consoleWarn = console.warn;
      try {
        console.warn = function(msg: string): void {
          assert.equal(msg, "Component with name 'DuplicateComponentName' already registered.");
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
        @Inject({name: 'prop'})
        private _prop: boolean;

        public get prop(): boolean { return this._prop; }
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
        private _tsdi: TSDI;

        public get prop(): TSDI { return this._tsdi; }
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

    it('should inject annotated constructor parameters', () => {
      tsdi.enableComponentScanner();

      @Component
      class ConstructorParameterComponent {}

      @Component
      class ComponentWithConstructor {
        private _tsdi: TSDI;

        constructor(@Inject() container: TSDI, @Inject b: ConstructorParameterComponent) {
          this._tsdi = container;
        }

        public get prop(): TSDI { return this._tsdi; }
      }
      assert.strictEqual(tsdi.get(ComponentWithConstructor).prop, tsdi);
    });

    it('should create a new instance for non-singletons', () => {
      tsdi.enableComponentScanner();

      @Component({singleton: false})
      class NonSingletonComponent {}

      assert.notEqual(tsdi.get(NonSingletonComponent), tsdi.get(NonSingletonComponent));
    });

    it('should register factories on components', () => {
      tsdi.enableComponentScanner();

      class NonSingletonObject {}

      @Component()
      class FactoryComponentWithSingletonFactory {
        @factory
        public someFactory(): NonSingletonObject {
          return new NonSingletonObject();
        }
      }

      @Component()
      class C {}

      assert.instanceOf(tsdi.get(NonSingletonObject), NonSingletonObject);
      assert.strictEqual(tsdi.get(NonSingletonObject), tsdi.get(NonSingletonObject));
    });

    it('should return a new component on each call for non singleton factories', () => {
      tsdi.enableComponentScanner();

      class NonSingletonObject {}

      @Component()
      class FactoryComponentWithNonSingletonFactory {
        @Factory({singleton: false})
        public someFactory(): NonSingletonObject {
          return new NonSingletonObject();
        }
      }

      assert.instanceOf(tsdi.get(NonSingletonObject), NonSingletonObject);
      assert.notEqual(tsdi.get(NonSingletonObject), tsdi.get(NonSingletonObject));
    });

    it('inject should fallback to typename if no explicit name given', () => {
      tsdi.enableComponentScanner();

      @Component()
      class InjectedComponent {
      }

      @Component()
      class ComponentWithNonNamedInject {
        @Inject()
        private _comp: InjectedComponent;
        get comp(): InjectedComponent {
          return this._comp;
        }
      }

      assert.strictEqual(tsdi.get(ComponentWithNonNamedInject).comp, tsdi.get(InjectedComponent));
    });

    it('should report an error if named injection could not resolve to a component', () => {
      tsdi.enableComponentScanner();

      @Component()
      class UnknownComponent {
      }

      @Component()
      class ComponentWithNamedInject {
        @Inject('unknown')
        private _comp: UnknownComponent;
        get comp(): UnknownComponent {
          return this._comp;
        }
      }

      assert.throws(() => tsdi.get(ComponentWithNamedInject).comp, "Component named 'unknown' not found");
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
        class NamedComponent1 {}

        @Component('Component')
        class NamedComponent2 {}

        assert.fail('Should throw error');
      } catch (e) {
        assert.match(e.message, /Duplicate name 'Component' for known Components/);
      }
    });

    it('should lazy create an inject dependencies', () => {
      tsdi.enableComponentScanner();

      @Component()
      class Injected {
      }

      @Component()
      class ComponentWithLazyInjection {
        @Inject({lazy: true})
        public dependency: Injected;
      }

      const component = tsdi.get(ComponentWithLazyInjection);
      const instances = (tsdi as any).instances;
      const injected = Object
        .keys(instances)
        .map((key: string) => instances[key])
        .filter(instance => instance instanceof Injected);
      assert.lengthOf(injected, 0);
      assert.isDefined(component.dependency);
    });

    it('should create eager components as soon as possible', (done: MochaDone) => {
      tsdi.enableComponentScanner();
      let count = 0;

      @component({eager: true})
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

    it('should respect dependency tree for eager creation', (done: MochaDone) => {
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
      class Component {
      }
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

    describe('with external classes', () => {
      it('should inject dependencies', () => {
        tsdi.enableComponentScanner();

        @Component('user2')
        class User2 extends User {
        }

        @external
        class ExternalClass {
          @Inject()
          public user: User;
          @Inject('user2')
          public user2: User;
        }

        const test = new ExternalClass();
        assert.strictEqual(test.user, tsdi.get(User));
        assert.strictEqual(test.user2, tsdi.get(User2));
      });

      it('should call the initializer', () => {
        tsdi.enableComponentScanner();

        let called = false;
        const fn = () => called = true;

        @External()
        class ExternalClass {
          @initialize()
          public init(): void {
            fn();
          }
        }

        const external = new ExternalClass();
        assert.isTrue(called);
      });

      it('should inject defined properties', () => {
        tsdi.enableComponentScanner();

        @External()
        class ExternalClass {
          @Inject('prop')
          private _prop: boolean;

          public get prop(): boolean { return this._prop; }
        }
        tsdi.addProperty('prop', false);

        assert.equal(new ExternalClass().prop, false);
      });

      it('should allow constructor injection', () => {
        tsdi.enableComponentScanner();

        @External()
        class ExternalClass {
          public injected: User;

          constructor(value: string, @Inject() user?: User) {
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
        class ExternalClass extends Base {
        }

        assert.instanceOf(new ExternalClass(), Base);
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
