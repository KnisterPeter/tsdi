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
