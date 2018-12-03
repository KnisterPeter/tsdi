import { getTestEnv, runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler generates constructor injected configuration', async () => {
  const { fs, host } = getTestEnv();
  fs.add(
    'file.ts',
    `
      import { container, managed } from 'tsdi/compiler/decorators';

      @managed
      export class Dependency {}

      @managed
      export class Entry {
        constructor(public dependency: Dependency) {}
      }

      @container({ units: [] })
      export abstract class Container {
        public abstract entry: Entry;
      }

      export function test(expect, container): void {
        expect(container.entry.dependency).toBeInstanceOf(Dependency);
      }
    `
  );

  await runCompiler(host, fs);

  await testContainer(fs);
});
