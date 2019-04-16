import { join } from 'path';
import { TSDI } from '../../../dist/legacy';
import { Compiler } from '../../../lib/compiler';
import { Level, Logger } from '../../../lib/compiler/logger';

test('Compiler should support legacy decorators', () => {
  const compiler = new Compiler(
    join(__dirname, 'tsconfig.json'),
    new Logger(Level.none)
  );
  const container = compiler.getContainer<import('.').Container>('Container');
  const Component = compiler.runtime.require('./index', __filename).Component;
  const getResult = compiler.runtime.require('./index', __filename).getResult;
  const External = compiler.runtime.require('./index', __filename).External;

  const instance = container.instantiate(TSDI);

  expect(instance.test).toBeInstanceOf(Component);
  expect(instance.test.dependency).toBe(instance.dependency);
  expect(instance.withConstructor.dependency).toBe(instance.dependency);
  expect(
    Object.getOwnPropertyDescriptor(instance.test, 'dependency2')!.value
  ).toBe(instance.dependency);

  expect(instance.nonSingleton).not.toBe(instance.nonSingleton);

  expect(() => instance.scoped).toThrow(
    "Component 'Scoped' not found: required scope 'scope' is not enabled"
  );
  instance.tsdi.getScope('scope').enter();
  expect(instance.scoped).toBeTruthy();

  expect(new External().tsdi).toBe(instance.tsdi);

  expect(getResult().initTest).toBeTruthy();
  instance.close();
  expect(getResult().destroyTest).toBeTruthy();
});
