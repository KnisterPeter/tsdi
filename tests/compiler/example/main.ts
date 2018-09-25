import { container } from '../../../lib/compiler/decorators';

export class Entry {}

@container({ units: [] })
export abstract class Container {
  public abstract entry: Entry;
}
