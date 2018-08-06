import { TSDI } from '../lib';

describe('TSDI without reflection should be configurable', () => {
  let tsdi: TSDI;
  beforeEach(() => {
    tsdi = new TSDI();
  });

  it('to declare injections for constructor and properties', () => {
    class Class {
      public dependency!: Dependency;
      // tslint:disable-next-line:no-parameter-properties
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
});
