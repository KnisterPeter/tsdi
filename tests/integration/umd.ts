declare const tsdi: any;

const t = new tsdi.TSDI();
t.enableComponentScanner();

@tsdi.component
class Dependency {
  public foo(): string {
    return 'bar';
  }
}

@tsdi.component
class Component {
  @tsdi.inject
  public dependency!: Dependency;
}

const component = t.get(Component);
localAssert(component instanceof Component);
localAssert(component.dependency.foo() === 'bar');

function localAssert(condition: boolean): void {
  if (!condition) {
    throw new Error('Failed');
  }
}
