import { join } from 'path';
import { Compiler } from '../../../lib/compiler';
import { Level, Logger } from '../../../lib/compiler/logger';

test('Compiler should support scopes', () => {
  const compiler = new Compiler(
    join(__dirname, 'tsconfig.json'),
    new Logger(Level.none)
  );
  const container = compiler.getContainer<import('.').Container>('Container');

  const instance = container.instantiate();

  expect(() => instance.test).toThrow(
    "Component 'InjectedConstructor' not found: required scope 'scope' is not enabled"
  );

  instance.tsdi.getScope('scope').enter();

  expect(instance.test).toBeTruthy();
});

test('Compiler should support scopes for provided dependencies', () => {
  const compiler = new Compiler(
    join(__dirname, 'tsconfig.json'),
    new Logger(Level.none)
  );
  const container = compiler.getContainer<import('.').Container>('Container');

  const instance = container.instantiate();

  expect(() => instance.test2).toThrow(
    "Component 'unknown' not found: required scope 'scope2' is not enabled"
  );

  instance.tsdi.getScope('scope2').enter();

  expect(instance.test2).toBeTruthy();
});
