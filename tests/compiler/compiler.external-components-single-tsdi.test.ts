import { runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler allows managing of external components', async () => {
  const files: { [name: string]: string } = {
    '/file.ts': `
      import { container, managed, meta } from '/decorators';

      @managed
      export class Dependency {}

      @container({ units: [] })
      export abstract class Container {
        public abstract dependency: Dependency;
      }

      @managed
      export class Entry {
        @managed
        public depenency!: Dependency;
      }

      export function test(expect, container): void {
        expect(new Entry().depenency).toBe(container.dependency);
      }
  `
  };

  await runCompiler(files);

  await testContainer(files);
});
