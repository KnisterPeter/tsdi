import { TSDI, component, inject, initialize } from '../lib/tsdi';

let origWarn: (...args: any[]) => void;

describe('TSDI', () => {
  let tsdi: TSDI;

  beforeEach(() => {
    // disable deprecation warning in tests
    origWarn = console.warn;
    console.warn = function(...args: any[]): void {
      if (
        args.length > 0 &&
        typeof args[0] === 'string' &&
        (args[0] as string).indexOf('deprecated') > -1
      ) {
        return;
      }
      origWarn(...args);
    };
    tsdi = new TSDI();
  });

  afterEach(() => {
    tsdi.close();
    console.warn = origWarn;
  });

  describe('when in mock mode', () => {
    beforeEach(() => {
      tsdi.enableComponentScanner();
    });

    it('should inject an auto-mocked instance', () => {
      let created = false;

      @component
      class Foo {
        public foo(): void {
          created = true;
        }
      }

      @component
      class Bar {
        @inject public foo!: Foo;

        @initialize
        protected init(): void {
          this.foo.foo();
        }
      }

      tsdi.enableAutomock();
      tsdi.get(Bar);

      expect(created).toBeFalsy();
    });

    it('should inject real instance if allowed', () => {
      let created = false;

      @component
      class Foo {
        public foo(): void {
          created = true;
        }
      }

      @component
      class Bar {
        @inject public foo!: Foo;

        @initialize
        protected init(): void {
          this.foo.foo();
        }
      }

      tsdi.enableAutomock(Foo);
      tsdi.get(Bar);

      expect(created).toBeTruthy();
    });

    it('should return a mock', () => {
      let created = false;

      @component
      class Foo {
        public foo(): void {
          //
        }
      }

      @component
      class Bar {
        @inject public foo!: Foo;

        @initialize
        protected init(): void {
          this.foo.foo();
        }
      }

      tsdi.enableAutomock();
      tsdi.mock(Foo).foo = () => (created = true);
      tsdi.get(Bar);

      expect(created).toBeTruthy();
    });
  });
});
