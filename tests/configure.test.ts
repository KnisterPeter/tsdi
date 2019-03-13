import { managed, TSDI } from '..';

describe('TSDI without reflection should be configurable', () => {
  let tsdi: TSDI;

  beforeEach(() => {
    tsdi = new TSDI();
  });

  afterEach(() => {
    tsdi.close();
  });

  it('to declare injections for constructor and properties', () => {
    class Class {
      public dependency!: Dependency;
      constructor(public dependency2: Dependency) {}
    }

    class Dependency {}

    tsdi.configureAndMark(Dependency);
    tsdi.configureAndMark(Class, {
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

    tsdi.configureAndMark(Dependency);
    tsdi.configureAndMark(Provider);
    tsdi.configureAndMark(Component, {
      provider: {
        class: Provider,
        method: 'provide',
        dependencies: [Dependency]
      }
    });

    expect(tsdi.get(Component)).toBeInstanceOf(Component);
    expect(tsdi.get(Component).dependency).toBeInstanceOf(Dependency);
  });

  it('to throw on unknown externals', () => {
    @managed
    class Component {}

    expect(() => new Component()).toThrow(/Component 'Component' not found/);
  });
});
