import { runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler container supports destroy lifecycle', async () => {
  const files = {
    '/file.ts': `
      import { managed, container, destroy } from '/decorators';
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

        public test(expect): void {
          this.entry.tsdi.close();
          expect(shutdownCalled).toBeTruthy();
        }
      }
    `
  };

  const code = await runCompiler(files);

  await testContainer(code, files, expect);
});
