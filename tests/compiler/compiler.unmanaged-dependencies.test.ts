import { getTestEnv, runCompiler } from './compiler.test.helper';

test('TSDI compiler throws on unmanaged dependencies', async () => {
  const { fs, host } = getTestEnv();
  fs.add(
    'file.ts',
    `
      import { container } from 'tsdi/compiler/decorators';

      export class Entry {}

      @container({ units: [] })
      export abstract class Container {
        public abstract entry: Entry;
      }
    `
  );

  await expect(runCompiler(host, fs)).rejects.toThrow(
    "Managed dependency 'Entry' is missing @managed decorator"
  );
});
