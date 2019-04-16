import { join } from 'path';
import { Compiler } from '../../../lib/compiler';
import { Level, Logger } from '../../../lib/compiler/logger';

test('Compiler should throw on unassinged external injection', () => {
  const compiler = new Compiler(
    join(__dirname, 'tsconfig.json'),
    new Logger(Level.none)
  );
  const container1 = compiler.getContainer<import('.').Container1>(
    'Container1'
  );

  expect(() => container1.instantiate()).toThrow(
    'Unassigned externals [Test] is not supported if using multiple containers'
  );
});
