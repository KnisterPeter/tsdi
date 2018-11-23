import {
  Component,
  component,
  external,
  External,
  initialize,
  Inject,
  inject,
  TSDI
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
    expect(test.user).toBe(tsdi.get(User));
    expect(test.user2).toBe(tsdi.get(User2));
  });

  it('should call the initializer', () => {
    tsdi.enableComponentScanner();

    const mock = jest.fn();

    @External()
    class ExternalClass {
      @initialize()
      public init(): void {
        mock();
      }
    }

    // tslint:disable-next-line:no-unused-expression
    new ExternalClass();
    expect(mock).toBeCalled();
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

    expect(new ExternalClass().prop).toBeFalsy();
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

    expect(new ExternalClass('value').injected).toBe(tsdi.get(User));
  });

  it('should keep static methods and properties', () => {
    tsdi.enableComponentScanner();
    const noop = () => console.log('noop');

    @External()
    class ExternalClass {
      public static user = 'test';
      public static noop = noop;
    }

    expect(ExternalClass.user).toBe('test');
    expect(ExternalClass.noop).toBe(noop);
  });

  it('should keep prototype chain correct', () => {
    tsdi.enableComponentScanner();

    class Base {}

    @External()
    class ExternalClass extends Base {}

    expect(new ExternalClass()).toBeInstanceOf(Base);
  });
});

describe('TSDI with external components', () => {
  it('should use the default resolver (latest created tsdi instance)', () => {
    const tsdiInacctive = new TSDI();
    const tsdiActive = new TSDI();

    @component
    class Injectable {}
    tsdiActive.register(Injectable);
    tsdiInacctive.register(Injectable);

    @external
    class Test {
      @inject public injectable!: Injectable;
    }

    expect(new Test().injectable).toBe(tsdiActive.get(Injectable));
    expect(new Test().injectable).not.toBe(tsdiInacctive.get(Injectable));
  });
  it('should use a custom resolver if provided', () => {
    const tsdiInacctive = new TSDI();
    TSDI.externalContainerResolver = () => tsdiInacctive;
    const tsdiActive = new TSDI();

    @component
    class Injectable {}
    tsdiActive.register(Injectable);
    tsdiInacctive.register(Injectable);

    @external
    class Test {
      @inject public injectable!: Injectable;
    }

    expect(new Test().injectable).toBe(tsdiInacctive.get(Injectable));
    expect(new Test().injectable).not.toBe(tsdiActive.get(Injectable));
  });
});
