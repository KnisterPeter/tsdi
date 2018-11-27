import { runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler allows managing of external components', async () => {
  const files = {
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

  const code = await runCompiler(files);

  await testContainer(code, files, expect);
});
