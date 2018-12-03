import { getTestEnv, runCompiler } from './compiler.test.helper';

test('TSDI compiler container throws if declard unit is not found', async () => {
  const { fs, host } = getTestEnv();
  fs.add(
    'file.ts',
    `
      import { container, unit, provides, initialize } from 'tsdi/compiler/decorators';

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
  );

  await expect(runCompiler(host, fs)).rejects.toThrowError(
    'Declared unit not found'
  );
});
