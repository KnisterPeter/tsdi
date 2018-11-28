import * as path from 'path';
import * as ts from 'typescript';
import {
  createResolver,
  ResolverFunction
} from '../../lib/compiler/module-resolver';

describe('Module Resolver', () => {
  let resolver: ResolverFunction;

  beforeAll(() => {
    resolver = createResolver(ts.sys);
  });

  it('will return undefined for unresolved modules', () => {
    expect(resolver(['unknown'], '/source.ts')).toEqual([undefined]);
  });

  it('will return the path for relative resolutions', () => {
    expect(resolver(['./compiler.entry-point.test'], __filename)).toEqual([
      {
        resolvedFileName: path.join(
          path.dirname(__filename),
          'compiler.entry-point.test.ts'
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
