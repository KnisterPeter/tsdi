import { join } from 'path';
import { Compiler } from '../../../lib/compiler';
import { Level, Logger } from '../../../lib/compiler/logger';

test('Compiler should support external component per container injection', () => {
  const compiler = new Compiler(
    join(__dirname, 'tsconfig.json'),
    new Logger(Level.none)
  );
  const container1 = compiler.getContainer<import('.').Container1>(
    'Container1'
  );
  const container2 = compiler.getContainer<import('.').Container2>(
    'Container2'
  );
  const Test = compiler.runtime.require('./index', __filename).Test;

  const c1 = container1.instantiate();
  const c2 = container2.instantiate();

  expect(new Test().dependency).not.toBe(c1.dependency);
  expect(new Test().dependency).toBe(c2.dependency);
});
