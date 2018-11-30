import { runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler generates configuration for runtime components', async () => {
  const files: { [name: string]: string } = {
    '/file.ts': `
      import { container } from '/decorators';
      import { component } from 'tsdi';

      @component
      export class Component {}

      @container({ units: [] })
      export abstract class Container {
        public abstract component: Component;
      }

      export function test(expect, container) {
      }
    `
  };

  await runCompiler(files);

  await testContainer(files);
});
