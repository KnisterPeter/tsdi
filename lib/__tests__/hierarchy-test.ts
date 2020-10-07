// tslint:disable: no-implicit-dependencies
import { assert } from 'chai';
import { TSDI, configure, component, external, inject } from '..';

@component
class Component {
  //
}

class Both {
  // tslint:disable-next-line: no-parameter-properties
  constructor(public target: string) {
    //
  }
}

class OnlyOuter {
  constructor() {
    //
  }
}

class OnlyInner {
  constructor() {
    //
  }
}

@external
class ExternalOuter {
  @inject
  public outer!: OnlyOuter;

  @inject
  public both!: Both;
}

@external
class ExternalInner {
  @inject
  public outer!: OnlyOuter;

  @inject
  public both!: Both;
}

describe('TSDI', () => {
  describe('when creating multiple containers in a hierarchy', () => {
    let outer: TSDI;
    let inner: TSDI;

    beforeEach(() => {
      class OuterConfig {
        @configure
        public external!: ExternalOuter;

        @configure
        public both(): Both {
          return new Both('outer');
        }

        @configure
        public onlyOuter(): OnlyOuter {
          return new OnlyOuter();
        }
      }

      outer = new TSDI(new OuterConfig());

      class InnerConfig {
        @configure
        public external!: ExternalInner;

        @configure
        public component!: Component;

        @configure
        public both(): Both {
          return new Both('inner');
        }
      }
      inner = new TSDI(new InnerConfig(), outer);
    });

    it('should resolve injections from the nearest scope', () => {
      const target = inner.get(Both).target;

      assert.equal(target, 'inner');
    });

    it('should resolve injections in the parent if required', () => {
      const comp = inner.get(OnlyOuter);

      assert.instanceOf(comp, OnlyOuter);
    });

    it('should not resolve injections in children', () => {
      assert.throws(() => outer.get(OnlyInner));
    });

    it('should inject externals from outer', () => {
      const external = new ExternalOuter();

      assert.strictEqual(external.both, outer.get(Both));
      assert.strictEqual(external.outer, outer.get(OnlyOuter));
    });

    it('should inject externals from inner', () => {
      const external = new ExternalInner();

      assert.strictEqual(external.both, inner.get(Both));
      assert.strictEqual(external.outer, inner.get(OnlyOuter));
    });

    it('should be able to free resources of child containers', () => {
      const destroyed: string[] = [];

      inner.addLifecycleListener({
        onDestroy(component): void {
          destroyed.push(component.constructor.name);
        },
      });

      inner.get(Component);
      inner.close();

      assert.include(destroyed, 'Component');
    });
  });
});
