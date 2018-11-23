import { runCompiler } from './compiler.test.helper';

test('TSDI compiler throws on unmanaged dependencies', async () => {
  const files = {
    '/file.ts': `
      import { container } from '/decorators';

      export class Entry {}

      @container({ units: [] })
      export abstract class Container {
        public abstract entry: Entry;
      }
    `
  };

  await expect(runCompiler(files)).rejects.toThrow(
    "Managed dependency 'Entry' is missing @managed decorator"
  );
});
