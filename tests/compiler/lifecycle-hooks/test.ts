import { join } from 'path';
import { Compiler } from '../../../lib/compiler';

test('Compiler should support lifecycle postConstruct hook', () => {
  const compiler = new Compiler(join(__dirname, 'tsconfig.json'));
  const container = compiler.getContainer<import('.').Container>('Container');

  const instance = container.instantiate();

  expect(instance.test.state.init).toBeTruthy();
});

test('Compiler should support lifecycle preDestroy hook', () => {
  const compiler = new Compiler(join(__dirname, 'tsconfig.json'));
  const container = compiler.getContainer<import('.').Container>('Container');

  const instance = container.instantiate();
  const state = instance.test.state;
  instance.close();

  expect(state.dispose).toBeTruthy();
});
