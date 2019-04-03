import { component, container, factory } from '../../../dist/legacy';

let factoryExecuted = false;

export function getResult(): any {
  return { factoryExecuted };
}

export class FactoryResult {}

@component
export class Factory {
  @factory
  public factoryMethod(): FactoryResult {
    factoryExecuted = true;
    return new FactoryResult();
  }
}

@container
export abstract class Container {
  public abstract factoryResult: FactoryResult;
}
