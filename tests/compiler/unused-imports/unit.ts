import { provides, unit } from '../../..';
import { Test } from './api';
import { TestImpl } from './impl';

@unit
export class Unit {
  @provides
  public test(): Test {
    return new TestImpl();
  }
}
