import { Component, Inject } from '../..';
import { Cyclic2 } from './cyclic2';

@Component()
export class Cyclic1 {
  @Inject({ lazy: false })
  public cyclic2!: Cyclic2;
}
