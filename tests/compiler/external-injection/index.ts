import { container, managed } from '../../..';

@managed
export class Dependency {}

@managed
export class Test {
  @managed
  public dependency!: Dependency;
}

@container
export abstract class Container {
  public abstract dependency: Dependency;
}
