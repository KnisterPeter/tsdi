import { afterConstruct, container, managed, meta } from '../../..';

let eagerCalled = false;

export function getResult(): any {
  return { eagerCalled };
}

@managed
@meta({ eager: true })
export class Test {
  @afterConstruct
  protected init(): void {
    eagerCalled = true;
  }
}

@container
export abstract class Container {}
