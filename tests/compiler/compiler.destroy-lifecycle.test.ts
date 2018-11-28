import { runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler container supports destroy lifecycle', async () => {
  const files: { [name: string]: string } = {
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

  await runCompiler(files);

  await testContainer(files['/tsdi-container.ts'], files, expect);
});
