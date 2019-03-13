import { container, managed, meta, postConstruct } from '../../..';

let eagerCalled = false;

export function getResult(): any {
  return { eagerCalled };
}

@managed
@meta({ eager: true })
export class Test {
  @postConstruct
  protected init(): void {
    eagerCalled = true;
  }
}

@container
export abstract class Container {}
