import { runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler supports non-singleton components', async () => {
  const files: { [name: string]: string } = {
    '/file.ts': `
      import { container, managed, meta } from '/decorators';

      @meta({singleton: false})
      @managed
      export class Entry {
      }

      @container({ units: [] })
      export abstract class Container {
        public abstract entry: Entry;

        public test(expect): void {
          expect(this.entry).not.toBe(this.entry);
        }
      }
    `
  };

  await runCompiler(files);

  await testContainer(files['/tsdi-container.ts'], files, expect);
});
