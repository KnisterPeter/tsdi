import { runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler supports factories with injected parameters', async () => {
  const files: { [name: string]: string } = {
    '/file.ts': `
      import { container, managed, unit, provides } from '/decorators';

      @managed
      export class Dependency {}

      export class Entry {
        constructor(public dependency: Dependency) {}
      }

      @unit
      export class Unit {
        @provides
        public entry(dependency: Dependency): Entry {
          return new Entry(dependency);
        }
      }

      @container({ units: [Unit] })
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
