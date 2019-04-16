import { container, managed, provides, unit } from '../../..';

@managed
export class Test {
  public name = Test.name;
}

export class TestWithDependency {
  constructor(public test: Test) {}
}

@unit
export class Unit {
  constructor(private readonly test: Test) {}

  @provides
  public testWithDependency(): TestWithDependency {
    return new TestWithDependency(this.test);
  }
}

@container({ units: [Unit] })
export abstract class Container {
  public abstract test: TestWithDependency;
}
