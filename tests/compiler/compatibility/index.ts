// tslint:disable-next-line:no-implicit-dependencies
import 'reflect-metadata';
import {
  component,
  container,
  destroy,
  external,
  initialize,
  inject,
  TSDI
} from '../../..';

let initTest = false;
let destroyTest = false;

export function getResult(): any {
  return { initTest, destroyTest };
}

@component({ singleton: false })
export class NonSingleton {}

@component({ scope: 'scope' })
export class Scoped {}

@component
export class Dependency {}

@component
export class Component {
  @inject
  public dependency!: Dependency;

  @inject({ lazy: false })
  public dependency2!: Dependency;

  @initialize
  public init(): void {
    initTest = true;
  }

  @destroy
  public dispose(): void {
    destroyTest = true;
  }
}

@component
export class ComponentWithConstructorInjection {
  constructor(@inject public dependency: Dependency) {}
}

@external
export class External {
  @inject public tsdi!: TSDI;
}

@container
export abstract class Container {
  public abstract tsdi: TSDI;
  public abstract test: Component;
  public abstract withConstructor: ComponentWithConstructorInjection;
  public abstract dependency: Dependency;
  public abstract nonSingleton: NonSingleton;
  public abstract scoped: Scoped;

  public abstract close(): void;
}
