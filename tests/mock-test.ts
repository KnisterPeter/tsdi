import { assert } from 'chai';
import 'source-map-support/register';

import { TSDI, component, inject, initialize } from '../lib/tsdi';

describe('TSDI', () => {
  let tsdi: TSDI;

  beforeEach(() => {
    tsdi = new TSDI();
  });

  afterEach(() => {
    tsdi.close();
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
        public foo: Foo;

        @initialize
        protected init(): void {
          this.foo.foo();
        }
      }

      tsdi.enableAutomock();
      const target = tsdi.get(Bar);

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
        public foo: Foo;

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
        public foo: Foo;

        @initialize
        protected init(): void {
          this.foo.foo();
        }
      }

      tsdi.enableAutomock();
      tsdi.mock(Foo).foo = () => created = true;
      tsdi.get(Bar);

      assert.isTrue(created);
    });
  });
});
