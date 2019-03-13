import { component, inject } from '../lib';
import { EagerComponent2 } from './eager2';

@component({ eager: true })
export class EagerComponent1 {
  @inject({ lazy: false })
  public dependency!: EagerComponent2;
}
