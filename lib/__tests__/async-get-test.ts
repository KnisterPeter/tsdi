// tslint:disable: no-implicit-dependencies
import { assert } from 'chai';
import { TSDI, component, initialize } from '..';

describe('TSDI', () => {
  let tsdi: TSDI;

  beforeEach(() => {
    tsdi = new TSDI();
  });

  afterEach(() => {
    tsdi.close();
  });

  it('should return dependency when they are ready', async () => {
    let runInit = false;

    @component
    class Component {
      @initialize
      protected init(): void {
        runInit = true;
      }
    }
    tsdi.register(Component);

    await tsdi.asyncGet(Component);

    assert.isTrue(runInit);
  });

  it('should return async dependency when they are ready', async () => {
    let runInit = false;

    @component
    class Component {
      @initialize
      protected async init(): Promise<void> {
        return new Promise((resolve) => {
          setTimeout(() => {
            runInit = true;
            resolve();
          }, 25);
        });
      }
    }
    tsdi.register(Component);

    await tsdi.asyncGet(Component);

    assert.isTrue(runInit);
  });

  it('should return async dependency when they where previously ready', async () => {
    let resolve: (() => void) | undefined;
    const promise = new Promise<void>((_resolve) => (resolve = _resolve));

    @component
    class Component {
      @initialize
      protected async init(): Promise<void> {
        resolve?.();
      }
    }
    tsdi.register(Component);

    tsdi.get(Component);
    await promise;

    const comp = await tsdi.asyncGet(Component);

    assert.instanceOf(comp, Component);
  });
});
