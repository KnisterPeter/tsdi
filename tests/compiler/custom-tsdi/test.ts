import { join } from 'path';
import { TSDI } from '../../..';
import { Compiler } from '../../../lib/compiler';
import { Level, Logger } from '../../../lib/compiler/logger';

test('Compiler should support custom TSDI implementations', () => {
  class ExtendedTSDI extends TSDI {}

  const compiler = new Compiler(
    join(__dirname, 'tsconfig.json'),
    new Logger(Level.none)
  );
  const container = compiler.getContainer<import('.').Container>('Container');

  const instance = container.instantiate(ExtendedTSDI);

  expect(instance.test.tsdi).toBeInstanceOf(ExtendedTSDI);
});
