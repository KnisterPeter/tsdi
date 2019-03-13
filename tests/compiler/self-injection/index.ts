import { container, managed, TSDI } from '../../..';

@managed
export class Test {
  constructor(public tsdi: TSDI) {}
}

@container
export abstract class Container {
  public abstract test: Test;
}
