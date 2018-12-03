import { getTestEnv, runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler supports non-singleton components', async () => {
  const { fs, host } = getTestEnv();
  fs.add(
    'file.ts',
    `
      import { container, managed, meta } from 'tsdi/compiler/decorators';

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
  );

  await runCompiler(host, fs);

  await testContainer(fs);
});
