import { container } from '../../..';

export class Test {}

@container
export abstract class Container {
  public abstract test: Test;
}
