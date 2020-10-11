// tslint:disable: no-implicit-dependencies
import { assert } from 'chai';
import { TSDI, component } from '..';

describe('TSDI', () => {
  let tsdi: TSDI;

  beforeEach(() => {
    tsdi = new TSDI();
  });

  afterEach(() => {
    tsdi.close();
  });
  it('should allow to remove lifecycle listeners', () => {
    @component
    class Component {}
    tsdi.register(Component);

    const removeLifecycleListener = tsdi.addLifecycleListener({
      onCreate(comp: any): void {
        if (comp instanceof Component) {
          assert.fail();
        }
      },
    });

    removeLifecycleListener();

    tsdi.get(Component);
  });
});
