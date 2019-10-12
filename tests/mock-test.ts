// tslint:disable: no-implicit-dependencies
import { assert } from 'chai';
import { component, initialize, inject, TSDI } from '../dist';

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
        args[0].indexOf('deprecated') > -1
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
        @inject
        public foo!: Foo;

        @initialize
        protected init(): void {
          this.foo.foo();
        }
      }

      tsdi.enableAutomock();
      tsdi.get(Bar);

      assert.isFalse(created);
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
        @inject
        public foo!: Foo;

        @initialize
        protected init(): void {
          this.foo.foo();
        }
      }

      tsdi.enableAutomock(Foo);
      tsdi.get(Bar);

      assert.isTrue(created);
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
        @inject
        public foo!: Foo;

        @initialize
        protected init(): void {
          this.foo.foo();
        }
      }

      tsdi.enableAutomock();
      tsdi.mock(Foo).foo = () => (created = true);
      tsdi.get(Bar);

      assert.isTrue(created);
    });
  });
});
