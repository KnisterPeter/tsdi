import { join } from 'path';
import { Compiler } from '../../../lib/compiler';

test('Compiler should support non-singleton components', () => {
  const compiler = new Compiler(join(__dirname, 'tsconfig.json'));
  const container = compiler.getContainer<import('.').Container>('Container');

  const instance = container.instantiate();

  expect(instance.test).not.toBe(instance.test);
});

test('Compiler should support non-singleton provided components', () => {
  const compiler = new Compiler(join(__dirname, 'tsconfig.json'));
  const container = compiler.getContainer<import('.').Container>('Container');

  const instance = container.instantiate();

  expect(instance.test2).not.toBe(instance.test2);
});
