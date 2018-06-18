// tslint:disable:no-implicit-dependencies
import { assert } from 'chai';
import 'source-map-support/register';
import {
  TSDI,
  Component,
  external,
  Inject,
  External,
  initialize
} from '../lib';

import { User } from './user';

describe('TSDI when creating a container instance with external classes', () => {
  let tsdi: TSDI;

  beforeEach(() => {
    tsdi = new TSDI();
  });

  afterEach(() => {
    tsdi.close();
  });

  it('should inject dependencies', () => {
    tsdi.enableComponentScanner();

    @Component('user2')
    class User2 extends User {}

    @external
    class ExternalClass {
      @Inject() public user!: User;
      @Inject('user2') public user2!: User;
    }

    const test = new ExternalClass();
    assert.strictEqual(test.user, tsdi.get(User));
    assert.strictEqual(test.user2, tsdi.get(User2));
  });

  it('should call the initializer', () => {
    tsdi.enableComponentScanner();

    let called = false;
    const fn = () => (called = true);

    @External()
    class ExternalClass {
      @initialize()
      public init(): void {
        fn();
      }
    }

    // tslint:disable-next-line:no-unused-expression
    new ExternalClass();
    assert.isTrue(called);
  });

  it('should inject defined properties', () => {
    tsdi.enableComponentScanner();

    @External()
    class ExternalClass {
      @Inject('prop') private readonly _prop!: boolean;

      public get prop(): boolean {
        return this._prop;
      }
    }
    tsdi.addProperty('prop', false);

    assert.equal(new ExternalClass().prop, false);
  });

  it('should allow constructor injection', () => {
    tsdi.enableComponentScanner();

    @External()
    class ExternalClass {
      public injected: User;

      constructor(_value: string, @Inject() user?: User) {
        this.injected = user!;
      }
    }

    assert.equal(new ExternalClass('value').injected, tsdi.get(User));
  });

  it('should keep static methods and properties', () => {
    tsdi.enableComponentScanner();
    const noop = () => console.log('noop');

    @External()
    class ExternalClass {
      public static user = 'test';
      public static noop = noop;
    }

    assert.strictEqual(ExternalClass.user, 'test');
    assert.strictEqual(ExternalClass.noop, noop);
  });

  it('should keep prototype chain correct', () => {
    tsdi.enableComponentScanner();

    class Base {}

    @External()
    class ExternalClass extends Base {}

    assert.instanceOf(new ExternalClass(), Base);
  });
});
