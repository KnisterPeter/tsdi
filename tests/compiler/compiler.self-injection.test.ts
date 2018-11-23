import { runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler container supports injecting itself', async () => {
  const files = {
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

        public test(expect): void {
          expect(this.entry.tsdi).toBeInstanceOf(TSDI);
        }
      }
    `
  };

  const code = await runCompiler(files);

  await testContainer(code, files, expect);
});
