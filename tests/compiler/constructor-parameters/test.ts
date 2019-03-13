import { join } from 'path';
import { Compiler } from '../../../lib/compiler';

test('Compiler should error on invalid constructor parameter types', () => {
  const compiler = new Compiler(join(__dirname, 'tsconfig.json'));
  const container = compiler.getContainer<import('.').Container>('Container');

  expect(() => container.generate(__dirname)).toThrow(
    'Only interfaces or classes are valid types for constructor injection. ' +
      "But for [dependency] got 'type ID = number;' instead"
  );
});
