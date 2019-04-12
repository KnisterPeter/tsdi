import { container } from '../../../..';

export class Entity {}

@container
export abstract class Container {
  public abstract entity: Entity;
}
