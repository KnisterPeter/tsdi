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
      }

      export function test(expect, container): void {
        expect(container.entry).not.toBe(this.entry);
      }
    `
  };

  await runCompiler(files);

  await testContainer(files);
});
