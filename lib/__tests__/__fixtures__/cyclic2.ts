import { Component, Inject } from '../..';
import { Cyclic1 } from './cyclic1';

@Component()
export class Cyclic2 {
  @Inject({ lazy: false })
  public cyclic1!: Cyclic1;
}
