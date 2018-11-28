import { runCompiler } from './compiler.test.helper';

test('TSDI compiler throws if multiple containers and non-accociated external components are found', async () => {
  const files = {
    '/file.ts': `
      import { container, managed, meta } from '/decorators';

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
  };

  await expect(runCompiler(files)).rejects.toThrow(
    'Unassigned externals [Entry] are not supported if using multiple containers'
  );
});
