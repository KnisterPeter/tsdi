// tslint:disable: no-implicit-dependencies
import { assert } from 'chai';
import { TSDI, configure, component, external, inject } from '..';

class Component1 {
  //
}

class Component2 {
  // tslint:disable-next-line: no-parameter-properties
  constructor(public comp1: Component1, public tsdi: TSDI) {
    //
  }
}

@component
class Component3 {
  @inject
  public comp2!: Component2;
}

@external
class Component4 {
  @inject
  public comp3!: Component3;
}

class Container {
  @configure
  public comp3!: Component3;

  @configure
  public comp4!: Component4;

  @configure
  public comp1(): Component1 {
    return new Component1();
  }

  @configure()
  public comp2(tsdi: TSDI): Component2 {
    return new Component2(this.comp1(), tsdi);
  }
}

describe('TSDI', () => {
  describe('with a configuration setup', () => {
    let tsdi: TSDI;

    beforeEach(() => {
      tsdi = new TSDI(new Container());
    });

    it('should create requested components', () => {
      const comp = tsdi.get(Component1);

      assert.instanceOf(comp, Component1);
    });

    it('should inject dependencies', () => {
      const comp1 = tsdi.get(Component1);
      const comp2 = tsdi.get(Component2);

      assert.strictEqual(comp1, comp2.comp1);
    });

    it('should support singletons', () => {
      const a = tsdi.get(Component1);
      const b = tsdi.get(Component1);

      assert.strictEqual(a, b);
    });

    it('should inject itself', () => {
      const comp = tsdi.get(Component2);

      assert.strictEqual(comp.tsdi, tsdi);
    });

    it('should allow decorated components', () => {
      const comp = tsdi.get(Component3);

      assert.strictEqual(comp.comp2.comp1, tsdi.get(Component1));
    });

    it('should allow external components', () => {
      const comp = new Component4();

      assert.strictEqual(comp.comp3.comp2.comp1, tsdi.get(Component1));
    });
  });
});
