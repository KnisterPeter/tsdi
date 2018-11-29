import { runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler supports factories which produces non singletons', async () => {
  const files: { [name: string]: string } = {
    '/file.ts': `
      import { container, unit, provides } from '/decorators';

      export class Entry {
      }

      @unit
      export class Unit {

        private createEntry() {
          return new Entry();
        }

        @provides({singleton: false})
        public entry(): Entry {
          // to handle more code cases the creation is
          // moved to another method
          return this.createEntry();
        }
      }

      @container({ units: [Unit] })
      export abstract class Container {
        public abstract entry: Entry;
      }

      export function test(expect, container): void {
        expect(container.entry).not.toBe(this.entry);
      }
    `
  };

  await runCompiler(files);

  await testContainer(files);
});
