import { join } from 'path';
import { Compiler } from '../../../lib/compiler';
import { Level, Logger } from '../../../lib/compiler/logger';

test('Compiler should support constructor injection', () => {
  const compiler = new Compiler(
    join(__dirname, 'tsconfig.json'),
    new Logger(Level.none)
  );
  const container = compiler.getContainer<import('.').Container>('Container');
  const Dependency = compiler.runtime.require('./index', __filename).Dependency;

  const instance = container.instantiate();

  expect(instance.test.dependency).toBeInstanceOf(Dependency);
});
