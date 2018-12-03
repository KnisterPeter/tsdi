import { getTestEnv, runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler supports factories which produces non singletons', async () => {
  const { fs, host } = getTestEnv();
  fs.add(
    'file.ts',
    `
      import { container, unit, provides } from 'tsdi/compiler/decorators';

      export class Entry {
      }

      @unit
      export class Unit {

        private createEntry() {
          return new Entry();
        }

        @provides({singleton: false})
        public entry(): Entry {
          // to handle more code cases the creation is
          // moved to another method
          return this.createEntry();
        }
      }

      @container({ units: [Unit] })
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
