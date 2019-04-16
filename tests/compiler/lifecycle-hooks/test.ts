import { join } from 'path';
import { Compiler } from '../../../lib/compiler';
import { Level, Logger } from '../../../lib/compiler/logger';

test('Compiler should support lifecycle afterConstruct hook', () => {
  const compiler = new Compiler(
    join(__dirname, 'tsconfig.json'),
    new Logger(Level.none)
  );
  const container = compiler.getContainer<import('.').Container>('Container');

  const instance = container.instantiate();

  expect(instance.test.state.init).toBeTruthy();
});

test('Compiler should support lifecycle beforeDestroy hook', () => {
  const compiler = new Compiler(join(__dirname, 'tsconfig.json'));
  const container = compiler.getContainer<import('.').Container>('Container');

  const instance = container.instantiate();
  const state = instance.test.state;
  instance.close();

  expect(state.dispose).toBeTruthy();
});
