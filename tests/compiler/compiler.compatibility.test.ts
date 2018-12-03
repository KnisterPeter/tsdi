import { getTestEnv, runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler generates configuration for runtime components', async () => {
  const { host, fs } = getTestEnv();
  fs.add(
    'file.ts',
    `
      import { container } from 'tsdi/compiler/decorators';
      import { TSDI, component, inject, initialize, destroy } from 'tsdi';

      let initCalled = false;
      let disposeCalled = false;

      @component({scope: 'scope'})
      export class ComponentWithScopeAndLifecycle {

        @initialize
        protected init(): void {
          initCalled = true;
          disposeCalled = true;
        }

        @destroy
        protected dispose(): void {
          disposeCalled = true;
        }

        public call(): void {
          //
        }

      }

      @component({singleton: false})
      export class NonSingleton {
      }

      @component
      export class Dependency {
      }

      @component
      export class Component {

        @inject
        public dependency!: Dependency;

      }

      @container({ units: [] })
      export abstract class Container {
        public abstract component: Component;
        public abstract dependency: Dependency;
        public abstract scoped: ComponentWithScopeAndLifecycle;
        public abstract nonSingleton: NonSingleton;

        public getTSDI(): TSDI {
          return this.tsdi;
        }
      }

      export function test(expect, container) {
        expect(container.component).toBeInstanceOf(Component);

        expect(container.component.dependency).toBe(container.dependency);

        expect(() => container.scoped.call()).toThrow();
        container.getTSDI().getScope('scope').enter();
        container.scoped.call()
        container.getTSDI().getScope('scope').leave();

        expect(container.nonSingleton).not.toBe(container.nonSingleton);
      }
    `
  );

  await runCompiler(host, fs);

  await testContainer(fs);
});
