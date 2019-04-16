import { join } from 'path';
import { Compiler } from '../../../lib/compiler';
import { Level, Logger } from '../../../lib/compiler/logger';

test('Compiler should resolve types from declared units', () => {
  const compiler = new Compiler(
    join(__dirname, 'tsconfig.json'),
    new Logger(Level.none)
  );
  const container = compiler.getContainer<import('.').Container>('Container');

  const code = container.generate(__dirname);
  const sourceFile = compiler.project.createSourceFile('./container.ts', code);
  sourceFile.getPreEmitDiagnostics().forEach(diag => {
    expect(diag.getMessageText()).toEqual(
      expect.not.stringMatching(
        "'C5_Test' is declared but its value is never read."
      )
    );
  });
});
