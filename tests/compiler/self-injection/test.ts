import { join } from 'path';
import { TSDI } from '../../..';
import { Compiler } from '../../../lib/compiler';

test('Compiler should support self injection', () => {
  const compiler = new Compiler(join(__dirname, 'tsconfig.json'));
  const container = compiler.getContainer<import('.').Container>('Container');

  const instance = container.instantiate();

  expect(instance.test.tsdi).toBeInstanceOf(TSDI);
});
