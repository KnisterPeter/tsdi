import { join } from 'path';
import { Compiler } from '../../../lib/compiler';
import { Level, Logger } from '../../../lib/compiler/logger';

test('Compiler should resolve types from declared units', () => {
  const compiler = new Compiler(
    join(__dirname, 'tsconfig.json'),
    new Logger(Level.none)
  );
  const container = compiler.getContainer<import('.').Container>('Container');

  const instance = container.instantiate();

  expect(instance.test.name).toBe('TestImpl');
});

test('Compiler should inject parameters into factory methods', () => {
  const compiler = new Compiler(join(__dirname, 'tsconfig.json'));
  const container = compiler.getContainer<import('.').Container>('Container');

  const instance = container.instantiate();

  expect(instance.testWithDependency.test.name).toBe('TestImpl');
});
