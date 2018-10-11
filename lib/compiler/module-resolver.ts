import { dirname, join } from 'path';
import * as ts from 'typescript';

export function resolver(
  moduleNames: string[],
  containingFile: string
): ts.ResolvedModule[] {
  return moduleNames.map(moduleName => {
    let resolvedPath = moduleName;
    if (!resolvedPath.startsWith('/')) {
      if (resolvedPath.startsWith('.')) {
        resolvedPath = join(dirname(containingFile), resolvedPath);
      } else {
        resolvedPath = join(
          ts.sys.getCurrentDirectory(),
          'node_modules',
          resolvedPath
        );
      }
    }
    if (ts.sys.fileExists(resolvedPath + '.ts')) {
      return { resolvedFileName: ts.sys.realpath!(resolvedPath + '.ts') };
    }
    if (ts.sys.fileExists(resolvedPath + '.d.ts')) {
      return { resolvedFileName: ts.sys.realpath!(resolvedPath + '.d.ts') };
    }
    return undefined!;
  });
}
