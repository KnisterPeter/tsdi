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

        public test(expect): void {
          expect(this.entry).toBeInstanceOf(Entry);
        }
      }
    `
  };

  await runCompiler(files);

  await testContainer(files['/tsdi-container.ts'], files, expect);
});
