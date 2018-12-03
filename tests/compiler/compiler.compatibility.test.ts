import { getTestEnv, runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler generates configuration for runtime components', async () => {
  const { host, fs } = getTestEnv();
  fs.add(
    'file.ts',
    `
      import { container } from 'tsdi/compiler/decorators';
      import { TSDI, component, inject } from 'tsdi';

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
        public abstract nonSingleton: NonSingleton;
      }

      export function test(expect, container) {
        expect(container.component).toBeInstanceOf(Component);

        expect(container.component.dependency).toBe(container.dependency);

        expect(container.nonSingleton).not.toBe(container.nonSingleton);
      }
    `
  );

  await runCompiler(host, fs);

  await testContainer(fs);
});
