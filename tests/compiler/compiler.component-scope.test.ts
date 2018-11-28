import { runCompiler } from './compiler.test.helper';

test('TSDI compiler generates scope configuration', async () => {
  const files: { [name: string]: string } = {
    '/file.ts': `
      import { container, managed, meta } from '/decorators';

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
  };

  await runCompiler(files);

  expect(files['/tsdi-container.ts']).toEqual(
    expect.stringContaining('meta: { singleton: true, scope: "some-scope" }')
  );
});
