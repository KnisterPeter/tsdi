import { runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler generates a container for an entry point', async () => {
  const files: { [name: string]: string } = {
    '/file.ts': `
      import { container, managed } from '/decorators';

      @managed
      export class Entry {}

      @container({ units: [] })
      export abstract class Container {
        public abstract entry: Entry;
      }

      export function test(expect, container): void {
        expect(container.entry).toBeInstanceOf(Entry);
      }
    `
  };

  await runCompiler(files);

  await testContainer(files);
});
