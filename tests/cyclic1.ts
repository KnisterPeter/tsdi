import { Component, Inject } from '../lib/decorators';
import { Cyclic2 } from './cyclic2';

@Component()
export class Cyclic1 {

  @Inject()
  public cyclic2: Cyclic2;

}
