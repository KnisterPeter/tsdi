import { join } from 'path';
import { Compiler } from '../../../lib/compiler';

test('Compiler should support legacy factory decorators', () => {
  const compiler = new Compiler(join(__dirname, 'tsconfig.json'));
  const container = compiler.getContainer<import('.').Container>('Container');

  let msg: string | undefined = undefined;
  const consoleWarn = console.warn;
  try {
    console.warn = function(text: string): void {
      msg = text;
    };

    container.instantiate();
  } finally {
    console.warn = consoleWarn;
  }

  expect(msg).toBe(
    'Unable to get return type of undefined#factoryMethod(); ' +
      'In order to use @factory you need to emit metadata ' +
      '(see https://tsdi.js.org/docs/en/getting-started.html#compiler-configuration)'
  );
});
