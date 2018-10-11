import * as path from 'path';
import * as ts from 'typescript';
import { resolver } from '../../lib/compiler/module-resolver';

describe('Module Resolver', () => {
  it('will return undefined for unresolved modules', () => {
    expect(resolver(['unknown'], '/source.ts')).toEqual([undefined]);
  });

  it('will return the path for relative resolutions', () => {
    expect(resolver(['./compiler.test'], __filename)).toEqual([
      {
        resolvedFileName: path.join(
          path.dirname(__filename),
          'compiler.test.ts'
        )
      }
    ]);
  });

  it('will return the path for node_modules', () => {
    expect(resolver(['tslib/tslib'], __filename)).toEqual([
      {
        resolvedFileName: path.join(
          ts.sys.getCurrentDirectory(),
          'node_modules',
          'tslib',
          'tslib.d.ts'
        )
      }
    ]);
  });
});
