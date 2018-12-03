import { getTestEnv, runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler container supports destroy lifecycle', async () => {
  const { fs, host } = getTestEnv();
  fs.add(
    'file.ts',
    `
      import { managed, container, destroy } from 'tsdi/compiler/decorators';
      import { TSDI } from 'tsdi';

      let shutdownCalled = false;

      @managed
      export class Entry {
        constructor(public tsdi: TSDI) {}

        @destroy
        public shutdown() {
          shutdownCalled = true;
        }
      }

      @container({ units: [] })
      export abstract class Container {
        public abstract entry: Entry;
      }

      export function test(expect, container): void {
        container.entry.tsdi.close();
        expect(shutdownCalled).toBeTruthy();
      }
    `
  );

  await runCompiler(host, fs);

  await testContainer(fs);
});
