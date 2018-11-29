import { runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler allows managing of external components', async () => {
  const files: { [name: string]: string } = {
    '/file.ts': `
      import { container, managed, initialize } from '/decorators';

      let initCalled = false;

      @container({ units: [] })
      export abstract class Container {
      }

      @managed
      export class Entry {
        @initialize
        protected init(): void {
          initCalled = true;
        }
      }

      export function test(expect, container): void {
        new Entry();
        expect(initCalled).toBeTruthy();
      }
  `
  };

  await runCompiler(files);

  await testContainer(files);
});
