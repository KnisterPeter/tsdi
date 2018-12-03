import { getTestEnv, runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler generates abstract entries and keeps concrete entries', async () => {
  const { fs, host } = getTestEnv();
  fs.add(
    'file.ts',
    `
      import { container, managed } from 'tsdi/compiler/decorators';

      @managed
      export class Entry {
      }

      @container({ units: [] })
      export abstract class Container {
        public abstract entry: Entry;

        public testEntry() {
          // Notice: This is not a singleton!!!
          return new Entry();
        }
      }

      export function test(expect, container): void {
        expect(container.entry).toEqual(container.testEntry());
      }
    `
  );

  await runCompiler(host, fs);

  await testContainer(fs);
});
