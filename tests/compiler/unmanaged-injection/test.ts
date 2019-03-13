import { join } from 'path';
import { Compiler } from '../../../lib/compiler';

test('Compiler should throw on unmanaged injection', () => {
  const compiler = new Compiler(join(__dirname, 'tsconfig.json'));
  const container = compiler.getContainer<import('.').Container>('Container');

  expect(() => container.instantiate()).toThrow(
    'Managed dependency [Test] is missing @managed decorator'
  );
});
