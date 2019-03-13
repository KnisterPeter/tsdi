import { container, managed, meta, provides, TSDI, unit } from '../../..';

@managed
@meta({ scope: 'scope' })
export class Test {}

export interface Test2 {}

@unit
export class Unit {
  @provides
  @meta({ scope: 'scope2' })
  public getTest(): Test2 {
    return new class {}();
  }
}

@container({ units: [Unit] })
export abstract class Container {
  public abstract tsdi: TSDI;
  public abstract test: Test;
  public abstract test2: Test2;
}
