import 'source-map-support/register';
import { assert } from 'chai';
import { TSDI, Component, Inject } from '../lib/decorators';
import { User } from './user';
import { Dependency } from './dependency';

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

      @Component()
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
      class B extends A {
        public m(): string { return 'b'; }
      }

      @Component({name: 'Foo'})
      class C extends A {
        public m(): string { return 'c'; }
      }

      @Component({name: 'Bar'})
      class D extends A {

        @Inject({name: 'Foo'})
        private a: A;

        public m(): string {
          return this.a.m();
        }
      }

      assert.equal(tsdi.get(A, 'Bar').m(), 'c');
    });

    it('should not allow registration with duplicate component name', () => {
      class A {};
      class B {};

      tsdi.register(A, 'Name');
      try {
        tsdi.register(B, 'Name');
        assert.fail('Should throw an error');
      } catch (e) {
        //
      }
    });

    it('should inject defined properties', () => {
      @Component()
      class A {
        @Inject({name: 'prop'})
        private _prop: boolean;

        public get prop(): boolean { return this._prop; }
      }
      tsdi.addProperty('prop', false);
      tsdi.register(A);
      assert.equal(tsdi.get(A).prop, false);
    });

    it('should throw if requried component was not found', () => {
      @Component()
      class A {}
      try {
        tsdi.get(A);
        assert.fail('Should throw');
      } catch (e) {
        assert.equal(e.message, "Component 'A' not found");
      }
    });

    it('should add itself to the component list', () => {
      tsdi.enableComponentScanner();

      @Component()
      class A {
        @Inject()
        private _tsdi: TSDI;

        public get prop(): TSDI { return this._tsdi; }
      }
      assert.strictEqual(tsdi.get(A).prop, tsdi);
    });

    it('should inject annotated constructor parameters', () => {
      tsdi.enableComponentScanner();

      @Component()
      class B {}

      @Component()
      class A {
        private _tsdi: TSDI;

        constructor(@Inject() container: TSDI, @Inject() b: B) {
          this._tsdi = container;
        }

        public get prop(): TSDI { return this._tsdi; }
      }
      assert.strictEqual(tsdi.get(A).prop, tsdi);
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
