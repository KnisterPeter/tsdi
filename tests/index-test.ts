import { assert } from 'chai';
import { User } from './user';
import { Dependency } from './dependency';
import { TSDI, Component } from '../lib/decorators';

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
