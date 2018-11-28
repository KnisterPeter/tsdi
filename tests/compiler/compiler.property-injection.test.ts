import { runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler supports property injection', async () => {
  const files: { [name: string]: string } = {
    '/file.ts': `
      import { container, managed } from '/decorators';

      @managed
      export class Dependency {}

      @managed
      export class Entry {
        @managed
        public dependency: Dependency
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

  await runCompiler(files);

  await testContainer(files['/tsdi-container.ts'], files, expect);
});
