import { container } from '../../..';
import { User } from './impl';
import { Unit } from './unit';

@container({ units: [Unit] })
export abstract class Container {
  public abstract user: User;
}
