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
      tsdi.register(User);
      tsdi.register(Dependency);
    });

    it('a returned component should be of the requested instance', () => {
      const user: User = tsdi.get(User);
      assert.isTrue(user instanceof User);
    });

    it('a returned instance should have all dependencies satisfied', () => {
      const user: User = tsdi.get(User);
      assert.equal(user.method(), 'hello');
    });

    it('two returned instances should have the same dependency instances', () => {
      const user1: User = tsdi.get(User);
      const user2: User = tsdi.get(User);
      assert.equal(user1.getDep(), user2.getDep());
    });

    it('a returned instance should call decorated lifecycle methods when available', () => {
      const user: User = tsdi.get(User);
      assert.equal(user.initResult(), 'init');
    });

    it('enabling componentScanner should add all known components to the container', () => {
      const container: TSDI = new TSDI();
      container.enableComponentScanner();
      const user: User = container.get(User);
      assert.isTrue(user instanceof User);
    });

    it('a container with enabled componentScanner should lazy register components', () => {
      const container: TSDI = new TSDI();
      container.enableComponentScanner();

      @Component()
      class Late {
      }

      const late: Late = container.get(Late);
      assert.isTrue(late instanceof Late);
    });

    it('components could be queried by name', () => {
      const container: TSDI = new TSDI();
      container.enableComponentScanner();

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
        private _a: A;

        public m(): string {
          return this._a.m();
        }
      }

      assert.equal(container.get(A, 'Bar').m(), 'c');
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
