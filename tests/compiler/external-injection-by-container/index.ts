import { container, managed } from '../../..';

@container
export abstract class Container1 {
  public abstract dependency: Dependency;
}

@container
export abstract class Container2 {
  public abstract dependency: Dependency;
}

@managed
export class Dependency {}

@managed({ by: Container2 })
export class Test {
  @managed
  public dependency!: Dependency;
}
