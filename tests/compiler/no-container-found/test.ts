import { join } from 'path';
import { Compiler } from '../../../lib/compiler';

test('Compiler should throw if no container was found', () => {
  const compiler = new Compiler(join(__dirname, 'tsconfig.json'));

  expect(() => compiler.getContainer('Container')).toThrow(
    'No container found'
  );
});
