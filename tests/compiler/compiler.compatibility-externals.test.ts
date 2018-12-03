import { getTestEnv, runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler generates configuration for external runtime components', async () => {
  const { host, fs } = getTestEnv();
  fs.add(
    'file.ts',
    `
      import { container } from 'tsdi/compiler/decorators';
      import { component, inject, external } from 'tsdi';

      @component
      export class Dependency {
      }

      @external
      export class External {

        @inject
        public dependency!: Dependency;

      }

      @container({ units: [] })
      export abstract class Container {
        public abstract dependency: Dependency;
      }

      export function test(expect, container) {
        expect(new External().dependency).toBe(container.dependency);
      }
    `
  );

  await runCompiler(host, fs);

  await testContainer(fs);
});
