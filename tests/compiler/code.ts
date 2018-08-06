import {
  container,
  inject,
  provides,
  unit
} from '../../lib/compiler/decorators';

//
// demo code
//

export class ClassA {
  public number = 0;
}

@inject
export class ClassB {
  // tslint:disable-next-line:no-parameter-properties
  constructor(public classA: ClassA) {}
}

export class ClassD {
  constructor(public classB: ClassB) {}
}

export class ClassC {
  @inject
  public classD!: ClassD;
}

@unit
export class DemoUnit {
  @provides
  public provideClassD(classB: ClassB): ClassD {
    return new ClassD(classB);
  }

  @provides
  public provideClassC(): ClassC {
    return new ClassC();
  }
}

@unit
export class DemoUnit2 {
  @provides
  public provideClassD(classB: ClassB): ClassD {
    return new ClassD(classB);
  }
}

@container({ units: [DemoUnit] })
export abstract class Container {
  public abstract classC: ClassC;
}

@container({ units: [DemoUnit2] })
export abstract class Container2 {
  public abstract classC: ClassC;
}
