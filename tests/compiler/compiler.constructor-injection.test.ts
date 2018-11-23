import { runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler generates constructor injected configuration', async () => {
  const files = {
    '/file.ts': `
      import { container, managed } from '/decorators';

      @managed
      export class Dependency {}

      @managed
      export class Entry {
        constructor(public dependency: Dependency) {}
      }

      @container({ units: [] })
      export abstract class Container {
        public abstract entry: Entry;

        public test(expect): void {
          expect(this.entry.dependency).toBeInstanceOf(Dependency);
        }
      }
    `
  };

  const code = await runCompiler(files);

  await testContainer(code, files, expect);
});
