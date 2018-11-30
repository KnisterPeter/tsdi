import { runCompiler, testContainer } from './compiler.test.helper';

test.only('TSDI compiler generates configuration for runtime components', async () => {
  const files: { [name: string]: string } = {
    '/file.ts': `
      import { container } from '/decorators';
      import { component, inject } from 'tsdi';

      @component
      export class Dependency {
      }

      @component
      export class Component {

        @inject
        public dependency!: Dependency;

      }

      @container({ units: [] })
      export abstract class Container {
        public abstract component: Component;
      }

      export function test(expect, container) {
        expect(container.component).toBeInstanceOf(Component);
      }
    `
  };

  await runCompiler(files);
  console.log(files['/tsdi-container.ts']);

  await testContainer(files);
});
