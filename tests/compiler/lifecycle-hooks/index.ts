import { container, managed, postConstruct, preDestroy } from '../../..';

@managed
export class State {
  public init = false;
  public dispose = false;
}

@managed
export class Test {
  constructor(public state: State) {}

  @postConstruct
  protected init(): void {
    this.state.init = true;
  }

  @preDestroy
  protected dispose(): void {
    this.state.dispose = true;
  }
}

@container
export abstract class Container {
  public abstract test: Test;

  public abstract close(): void;
}
