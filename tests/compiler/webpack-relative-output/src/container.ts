import { container, managed } from '../../../..';

@managed
export class Entity {}

@container
export abstract class Container {
  public abstract entity: Entity;
}
