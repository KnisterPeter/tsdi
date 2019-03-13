import { join } from 'path';
import { Compiler } from '../../../lib/compiler';

test('Compiler should throw on ambigeous container name', () => {
  const compiler = new Compiler(join(__dirname, 'tsconfig.json'));

  expect(() => compiler.getContainer('Container')).toThrow(
    "Multiple containers with name 'Container' found. Container name must be unique"
  );
});
