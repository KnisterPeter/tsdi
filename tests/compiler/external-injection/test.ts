import { join } from 'path';
import { Compiler } from '../../../lib/compiler';

test('Compiler should support external component injection', () => {
  const compiler = new Compiler(join(__dirname, 'tsconfig.json'));
  const container = compiler.getContainer<import('.').Container>('Container');
  const Test = compiler.runtime.require('./index', __filename).Test;
  const Dependency = compiler.runtime.require('./index', __filename).Dependency;

  container.instantiate();

  expect(new Test().dependency).toBeInstanceOf(Dependency);
});
