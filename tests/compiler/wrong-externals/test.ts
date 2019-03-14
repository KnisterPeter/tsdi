import { join } from 'path';
import { Compiler } from '../../../lib/compiler';

test('Compiler should throw on unmanaged injection', () => {
  const compiler = new Compiler(join(__dirname, 'tsconfig.json'));
  const container = compiler.getContainer<import('.').Container>('Container');

  const instance = container.instantiate();

  expect(() => instance.test).toThrow("Failed to get TSDI for 'Wrong'");
});
