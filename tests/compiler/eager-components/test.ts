import { join } from 'path';
import { Compiler } from '../../../lib/compiler';

test('Compiler should support constructor injection', done => {
  const compiler = new Compiler(join(__dirname, 'tsconfig.json'));
  const container = compiler.getContainer<import('.').Container>('Container');
  const getResult = compiler.runtime.require('./index', __filename).getResult;

  container.instantiate();

  setTimeout(() => {
    expect(getResult().eagerCalled).toBeTruthy();
    done();
  }, 10);
});
