import { container, managed } from '../../..';

type ID = number;

@managed
export class Test {
  constructor(public dependency: ID) {}
}

@container
export abstract class Container {
  public abstract test: Test;
}

@managed
export class Test2 {
  @managed
  public dependency!: ID;
}

@container
export abstract class Container2 {
  public abstract test: Test2;
}
