import { join } from 'path';
import { Compiler } from '../../../lib/compiler';

test('Compiler should generate concrete container implementation', () => {
  const compiler = new Compiler(join(__dirname, 'tsconfig.json'));
  const container = compiler.getContainer<import('.').Container>('Container');
  const Test = compiler.runtime.require('./index', __filename).Test;

  const instance = container.instantiate();

  expect(instance.test).toBeInstanceOf(Test);
});
