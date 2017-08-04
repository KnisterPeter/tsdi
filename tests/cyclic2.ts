import { Component, Inject } from '../lib/decorators';
import { Cyclic1 } from './cyclic1';

@Component()
export class Cyclic2 {

  @Inject()
  public cyclic1: Cyclic1;

}
