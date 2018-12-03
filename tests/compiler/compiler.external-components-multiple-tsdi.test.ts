import { getTestEnv, runCompiler } from './compiler.test.helper';

test('TSDI compiler throws if multiple containers and non-accociated external components are found', async () => {
  const { fs, host } = getTestEnv();
  fs.add(
    'file.ts',
    `
      import { container, managed, meta } from 'tsdi/compiler/decorators';

      @container({ units: [] })
      export abstract class Container {
      }

      @container({ units: [] })
      export abstract class Container2 {
      }

      @managed
      export class Entry {
      }
    `
  );

  await expect(runCompiler(host, fs)).rejects.toThrow(
    'Unassigned externals [Entry] are not supported if using multiple containers'
  );
});
