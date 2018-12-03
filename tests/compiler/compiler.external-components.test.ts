import { getTestEnv, runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler allows managing of external components', async () => {
  const { fs, host } = getTestEnv();
  fs.add(
    'file.ts',
    `
      import { container, managed, meta } from 'tsdi/compiler/decorators';

      @managed
      export class Dependency {}

      @container({ units: [] })
      export abstract class Container {
        public abstract dependency: Dependency;
      }

      @container({ units: [] })
      export abstract class Container2 {
        public abstract dependency: Dependency;
      }

      @managed({by: Container})
      export class Entry {
        @managed
        public depenency!: Dependency;
      }

      export function test(expect, container, container2): void {
        expect(new Entry().depenency).toBe(container.dependency);
        expect(new Entry().depenency).not.toBe(container2.dependency);
      }
  `
  );

  await runCompiler(host, fs);

  await testContainer(
    fs,
    ['/tsdi-container', 'tsdi-container2'],
    ['TSDIContainer', 'TSDIContainer2']
  );
});
