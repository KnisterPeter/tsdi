import { runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler generates a container for an entry point', async () => {
  const files = {
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

  const code = await runCompiler(files);

  await testContainer(code, files, expect);
});
