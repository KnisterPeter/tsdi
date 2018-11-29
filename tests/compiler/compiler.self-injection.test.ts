import { runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler container supports injecting itself', async () => {
  const files: { [name: string]: string } = {
    '/file.ts': `
      import { managed, container } from '/decorators';
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
  };

  await runCompiler(files);

  await testContainer(files);
});
