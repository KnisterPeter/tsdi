import { runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler generates constructor injected configuration', async () => {
  const files = {
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

  const code = await runCompiler(files);

  await testContainer(code, files, expect);
});
