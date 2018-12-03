import { getTestEnv, runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler container supports injecting itself', async () => {
  const { fs, host } = getTestEnv();
  fs.add(
    'file.ts',
    `
      import { managed, container } from 'tsdi/compiler/decorators';
      import { TSDI } from 'tsdi';

      @managed
      export class Entry {
        constructor(public tsdi: TSDI) {}
      }

      @container({ units: [] })
      export abstract class Container {
        public abstract entry: Entry;
      }

      export function test(expect, container): void {
        expect(container.entry.tsdi).toBeInstanceOf(TSDI);
      }
    `
  );

  await runCompiler(host, fs);

  await testContainer(fs);
});
