import { runCompiler } from './compiler.test.helper';

test('TSDI compiler container throws if declard unit is not found', async () => {
  const files = {
    '/file.ts': `
      import { container, unit, provides, initialize } from '/decorators';

      export class Entry {
        public ready = false;

        @initialize
        protected init(): void {
          this.ready = true;
        }
      }

      @container({ units: [Unit] })
      export abstract class Container {
        public abstract entry: Entry;

        public test(expect): void {
          expect(this.entry.ready).toBeTruthy();
        }
      }
    `
  };

  await expect(runCompiler(files)).rejects.toThrowError(
    'Declared unit not found'
  );
});
