import { container, managed, meta, provides, unit } from '../../..';

@managed
@meta({ singleton: false })
export class Test {}

export interface Interface {}

export class Test2 implements Interface {}

@unit
export class Unit {
  @provides
  @meta({ singleton: false })
  public test2(): Interface {
    return new Test2();
  }
}

@container({ units: [Unit] })
export abstract class Container {
  public abstract test: Test;
  public abstract test2: Interface;
}
