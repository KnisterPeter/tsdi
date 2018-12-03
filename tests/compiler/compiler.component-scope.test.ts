import { getTestEnv, runCompiler } from './compiler.test.helper';

test('TSDI compiler generates scope configuration', async () => {
  const { fs, host } = getTestEnv();
  fs.add(
    'file.ts',
    `
      import { container, managed, meta } from 'tsdi/compiler/decorators';

      @managed
      @meta({scope: 'some-scope'})
      export class Entry {}

      @container({ units: [] })
      export abstract class Container {
        public abstract entry: Entry;

        public test(expect): void {
          this.tsdi.getScope('some-scope').enter();

          expect(this.entry).toBeInstanceOf(Entry);
        }
      }
    `
  );

  await runCompiler(host, fs);

  expect(fs.get('tsdi-container.ts')).toEqual(
    expect.stringContaining("meta: { singleton: true, scope: 'some-scope' }")
  );
});
