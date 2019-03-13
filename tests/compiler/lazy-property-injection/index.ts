import { container, managed } from '../../..';

@managed
export class Dependency {}

@managed
export class Test {
  @managed({ lazy: false })
  public dependency!: Dependency;
}

@container
export abstract class Container {
  public abstract test: Test;
}
