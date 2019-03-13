import { container, provides, unit } from '../../..';

interface Test {
  name: string;
}

export class TestImpl implements Test {
  public name = TestImpl.name;
}

interface Interface {
  test: Test;
}

export class TestWithDependency implements Interface {
  constructor(public test: Test) {}
}

@unit
export class Unit {
  @provides
  public test(): Test {
    return new TestImpl();
  }

  @provides
  public testWithDependency(test: Test): Interface {
    return new TestWithDependency(test);
  }
}

@container({ units: [Unit] })
export abstract class Container {
  public abstract test: Test;
  public abstract testWithDependency: Interface;
}
