import { container, managed } from '../../..';

@container
export abstract class Container {
  public abstract test: Test;
}

export class Wrong {}

@managed({ by: Wrong })
export class Test {}
