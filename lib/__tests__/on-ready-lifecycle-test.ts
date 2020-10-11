// tslint:disable: no-implicit-dependencies
import { assert } from 'chai';
import { TSDI, component, initialize, inject } from '..';

describe('TSDI', () => {
  let tsdi: TSDI;

  beforeEach(() => {
    tsdi = new TSDI();
  });

  afterEach(() => {
    tsdi.close();
  });

  describe('with initializers', () => {
    it('should notify when a component without initializer is ready to be used', (done) => {
      @component
      class Component {}
      tsdi.register(Component);

      tsdi.addLifecycleListener({
        onReady(component: any): void {
          assert.instanceOf(component, Component);
          done();
        },
      });

      tsdi.get(Component);
    });

    it('should notify when a component is ready to be used', (done) => {
      @component
      class Component {
        @initialize
        protected init(): void {
          //
        }
      }
      tsdi.register(Component);

      tsdi.addLifecycleListener({
        onReady(component: any): void {
          assert.instanceOf(component, Component);
          done();
        },
      });

      tsdi.get(Component);
    });

    it('should notify when a component with async dependency is ready to be used', (done) => {
      @component
      class Dependency {
        @initialize
        protected async init(): Promise<void> {
          return Promise.resolve();
        }
      }
      tsdi.register(Dependency);

      @component
      class Component {
        @inject
        public readonly dependency!: Dependency;

        @initialize
        protected async init(): Promise<void> {
          return Promise.resolve();
        }
      }
      tsdi.register(Component);

      tsdi.addLifecycleListener({
        onReady(component: any): void {
          if (component instanceof Component) {
            assert.instanceOf(component, Component);
            done();
          }
        },
      });

      tsdi.get(Component);
    });

    it('should notify when a component without initializer but with async dependency is ready to be used', (done) => {
      @component
      class Dependency {
        @initialize
        protected async init(): Promise<void> {
          return Promise.resolve();
        }
      }
      tsdi.register(Dependency);

      @component
      class Component {
        @inject
        public readonly dependency!: Dependency;
      }
      tsdi.register(Component);

      tsdi.addLifecycleListener({
        onReady(component: any): void {
          if (component instanceof Component) {
            assert.instanceOf(component, Component);
            done();
          }
        },
      });

      tsdi.get(Component);
    });
  });
});
