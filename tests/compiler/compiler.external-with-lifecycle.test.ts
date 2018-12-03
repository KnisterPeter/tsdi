import { getTestEnv, runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler allows managing of external components', async () => {
  const { fs, host } = getTestEnv();
  fs.add(
    'file.ts',
    `
      import { container, managed, initialize } from 'tsdi/compiler/decorators';

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
  );

  await runCompiler(host, fs);

  await testContainer(fs);
});
