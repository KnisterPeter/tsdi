import { join } from 'path';
import { Compiler } from '../../../lib/compiler';
import { Level, Logger } from '../../../lib/compiler/logger';

test('Compiler should throw on unmanaged injection', () => {
  const compiler = new Compiler(
    join(__dirname, 'tsconfig.json'),
    new Logger(Level.none)
  );
  const container = compiler.getContainer<import('.').Container>('Container');

  const instance = container.instantiate();

  expect(() => instance.test).toThrow("Failed to get TSDI for 'Wrong'");
});
