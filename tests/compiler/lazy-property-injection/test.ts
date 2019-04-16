import { join } from 'path';
import { Compiler } from '../../../lib/compiler';
import { Level, Logger } from '../../../lib/compiler/logger';

test('Compiler should support property injection', () => {
  const compiler = new Compiler(
    join(__dirname, 'tsconfig.json'),
    new Logger(Level.none)
  );
  const container = compiler.getContainer<import('.').Container>('Container');
  const Dependency = compiler.runtime.require('./index', __filename).Dependency;

  const instance = container.instantiate();

  expect(
    Object.getOwnPropertyDescriptor(instance.test, 'dependency')!.value
  ).toBeInstanceOf(Dependency);
});
