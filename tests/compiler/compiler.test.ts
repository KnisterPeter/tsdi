import { runCompiler, testContainer } from './compiler.test.helper';

describe('TSDI compiler', () => {
  it('generates a container for an entry point', async () => {
    const files = {
      '/file.ts': `
        import { container } from '/decorators';

        export class Entry {}

        @container({ units: [] })
        export abstract class Container {
          public abstract entry: Entry;

          public test(expect): void {
            expect(this.entry).toBeInstanceOf(Entry);
          }
        }
      `
    };

    const code = await runCompiler(files);

    await testContainer(code, files, expect);
  });

  it('generates constructor injected configuration', async () => {
    const files = {
      '/file.ts': `
        import { container, managed } from '/decorators';

        export class Dependency {}

        @managed
        export class Entry {
          constructor(public dependency: Dependency) {}
        }

        @container({ units: [] })
        export abstract class Container {
          public abstract entry: Entry;

          public test(expect): void {
            expect(this.entry.dependency).toBeInstanceOf(Dependency);
          }
        }
      `
    };

    const code = await runCompiler(files);

    await testContainer(code, files, expect);
  });

  it('choses the declared unit', async () => {
    const files = {
      '/file.ts': `
        import { container, unit, provides } from '/decorators';

        export class Entry {
          constructor() {}
        }

        @unit
        export class Unit {
          @provides
          public entry(): Entry {
            return new Entry();
          }
        }

        @unit
        export class Unit2 {
          @provides
          public entry(): Entry {
            throw new Error('Wrong unit');
          }
        }

        @container({ units: [Unit] })
        export abstract class Container {
          public abstract entry: Entry;

          public test(expect): void {
            expect(this.entry).toBeInstanceOf(Entry);
          }
        }
      `
    };

    const code = await runCompiler(files);

    await testContainer(code, files, expect);
  });

  it('supports factories with injected parameters', async () => {
    const files = {
      '/file.ts': `
        import { container, unit, provides } from '/decorators';

        export class Dependency {}

        export class Entry {
          constructor(public dependency: Dependency) {}
        }

        @unit
        export class Unit {
          @provides
          public entry(dependency: Dependency): Entry {
            return new Entry(dependency);
          }
        }

        @container({ units: [Unit] })
        export abstract class Container {
          public abstract entry: Entry;

          public test(expect): void {
            expect(this.entry.dependency).toBeInstanceOf(Dependency);
          }
        }
      `
    };

    const code = await runCompiler(files);

    await testContainer(code, files, expect);
  });

  it('supports property injection', async () => {
    const files = {
      '/file.ts': `
        import { container, managed } from '/decorators';

        export class Dependency {}

        export class Entry {
          @managed
          public dependency: Dependency
        }

        @container({ units: [] })
        export abstract class Container {
          public abstract entry: Entry;

          public test(expect): void {
            expect(this.entry.dependency).toBeInstanceOf(Dependency);
          }
        }
      `
    };

    const code = await runCompiler(files);

    await testContainer(code, files, expect);
  });

  it.only('supports non-singleton components', async () => {
    const files = {
      '/file.ts': `
        import { container, managed, meta } from '/decorators';

        @meta({singleton: false})
        export class Entry {
        }

        @container({ units: [] })
        export abstract class Container {
          public abstract entry: Entry;

          public test(expect): void {
            expect(this.entry).not.toBe(this.entry);
          }
        }
      `
    };

    const code = await runCompiler(files);

    await testContainer(code, files, expect);
  });
});
