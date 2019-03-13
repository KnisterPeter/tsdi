import { container, managed } from '../../..';

@managed
export class Test {}

@container
export abstract class Container {
  public abstract test: Test;
}
