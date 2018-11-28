import { runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler allows managing of external components', async () => {
  const files: { [name: string]: string } = {
    '/file.ts': `
      import { container, managed, meta } from '/decorators';

      @managed
      export class Dependency {}

      @container({ units: [] })
      export abstract class Container {
        public abstract dependency: Dependency;

        public test(expect): void {
          expect(new Entry().depenency).toBe(this.dependency);
        }
      }

      @managed
      export class Entry {
        @managed
        public depenency!: Dependency;
      }
    `
  };

  await runCompiler(files);

  await testContainer(files['/tsdi-container.ts'], files, expect);
});
