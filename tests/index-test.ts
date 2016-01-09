import { assert } from 'chai';
import { User } from './user';
import { Dependency } from './dependency';
import { TSDI } from '../lib/decorators';

describe('TSDI', () => {

  describe('when creating a container instance', () => {
    const tsdi: TSDI = new TSDI();
    tsdi.register(User);
    tsdi.register(Dependency);

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
