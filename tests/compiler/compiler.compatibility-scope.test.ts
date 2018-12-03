import { getTestEnv, runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler generates configuration for runtime components with scope and lifecycle', async () => {
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
        }

        @destroy
        protected dispose(): void {
          disposeCalled = true;
        }

        public call(): void {
          //
        }

      }

      @container({ units: [] })
      export abstract class Container {
        public abstract scoped: ComponentWithScopeAndLifecycle;

        public getTSDI(): TSDI {
          return this.tsdi;
        }
      }

      export function test(expect, container) {
        expect(() => container.scoped.call()).toThrow();

        container.getTSDI().getScope('scope').enter();
        container.scoped.call()
        container.getTSDI().getScope('scope').leave();

        expect(initCalled).toBeTruthy();
        expect(disposeCalled).toBeTruthy();
      }
    `
  );

  await runCompiler(host, fs);

  await testContainer(fs);
});
