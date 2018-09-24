import { TSDI } from '../lib';

describe('TSDI without reflection should be configurable', () => {
  let tsdi: TSDI;
  beforeEach(() => {
    tsdi = new TSDI();
  });

  it('to declare injections for constructor and properties', () => {
    class Class {
      public dependency!: Dependency;
      constructor(public dependency2: Dependency) {}
    }

    class Dependency {}

    tsdi.configure(Dependency);
    tsdi.configure(Class, {
      constructorDependencies: [Dependency],
      propertyDependencies: [{ property: 'dependency', type: Dependency }]
    });

    expect(tsdi.get(Class).dependency).toBeInstanceOf(Dependency);
    expect(tsdi.get(Class).dependency2).toBeInstanceOf(Dependency);
  });

  it('to declare injections by providers', () => {
    class Component {
      constructor(public dependency: Dependency) {}
    }
    class Dependency {}

    class Provider {
      public provide(dependency: Dependency): Component {
        return new Component(dependency);
      }
    }

    tsdi.configure(Dependency);
    tsdi.configure(Provider);
    tsdi.configure(Component, {
      provider: {
        class: Provider,
        method: 'provide',
        dependencies: [Dependency]
      }
    });

    expect(tsdi.get(Component)).toBeInstanceOf(Component);
    expect(tsdi.get(Component).dependency).toBeInstanceOf(Dependency);
  });
});
