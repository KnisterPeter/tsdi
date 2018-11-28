import { runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler container supports initialize lifecycle', async () => {
  const files: { [name: string]: string } = {
    '/file.ts': `
      import { container, managed, initialize } from '/decorators';

      @managed
      export class Entry {
        public ready = false;

        @initialize
        protected init(): void {
          this.ready = true;
        }
      }

      @container({ units: [] })
      export abstract class Container {
        public abstract entry: Entry;

        public test(expect): void {
          expect(this.entry.ready).toBeTruthy();
        }
      }
    `
  };

  await runCompiler(files);

  await testContainer(files['/tsdi-container.ts'], files, expect);
});
