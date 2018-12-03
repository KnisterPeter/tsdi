import { getTestEnv, runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler supports factories with injected parameters', async () => {
  const { fs, host } = getTestEnv();
  fs.add(
    'file.ts',
    `
      import { container, managed, unit, provides } from 'tsdi/compiler/decorators';

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
      }

      export function test(expect, container): void {
        expect(container.entry.dependency).toBeInstanceOf(Dependency);
      }
    `
  );

  await runCompiler(host, fs);

  await testContainer(fs);
});
