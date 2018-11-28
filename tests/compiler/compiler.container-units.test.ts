import { runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler choses the declared unit', async () => {
  const files: { [name: string]: string } = {
    '/file.ts': `
      import { container, unit, provides } from '/decorators';

      export class Entry {
        constructor() {}
      }

      @unit
      export class Unit {
        @provides
        public entry(): Entry {
          return new Entry();
        }
      }

      @unit
      export class Unit2 {
        @provides
        public entry(): Entry {
          throw new Error('Wrong unit');
        }
      }

      @container({ units: [Unit] })
      export abstract class Container {
        public abstract entry: Entry;

        public test(expect): void {
          expect(this.entry).toBeInstanceOf(Entry);
        }
      }
    `
  };

  await runCompiler(files);

  await testContainer(files['/tsdi-container.ts'], files, expect);
});
