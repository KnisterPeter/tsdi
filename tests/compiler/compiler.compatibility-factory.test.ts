import { getTestEnv, runCompiler, testContainer } from './compiler.test.helper';

test('TSDI compiler generates configuration for runtime factory components', async () => {
  const { host, fs } = getTestEnv();
  fs.add(
    'file.ts',
    `
      import { container } from 'tsdi/compiler/decorators';
      import { TSDI, component, inject, factory } from 'tsdi';

      let factoryCalled = false;

      export class Dependency {
      }

      @component
      export class Component {

        @inject
        public dependency!: Dependency;

      }

      @component
      export class Factory {

        @factory
        public getDependency(): Dependency {
          factoryCalled = true;
          return new Dependency();
        }

      }

      @container({ units: [] })
      export abstract class Container {
        public abstract component: Component;
      }

      export function test(expect, container) {
        expect(container.component.dependency).toBeInstanceOf(Dependency);
        expect(factoryCalled).toBeTruthy();
      }
    `
  );

  await runCompiler(host, fs);

  await testContainer(fs);
});
