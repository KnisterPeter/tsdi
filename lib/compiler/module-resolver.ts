import { dirname, join } from 'path';
import * as ts from 'typescript';
import { CompilerHost } from './host';

export type ResolverFunction = (
  names: string[],
  file: string
) => ts.ResolvedModule[];

export function createResolver(host: CompilerHost = ts.sys): ResolverFunction {
  return function resolver(
    moduleNames: string[],
    containingFile: string
  ): ts.ResolvedModule[] {
    return moduleNames.map(moduleName => {
      let resolvedPath = moduleName;
      if (!resolvedPath.startsWith('/')) {
        if (resolvedPath.startsWith('.')) {
          resolvedPath = join(dirname(containingFile), resolvedPath);
        } else {
          const { resolvedModule } = ts.nodeModuleNameResolver(
            moduleName,
            containingFile,
            {},
            host
          );
          if (resolvedModule) {
            return { resolvedFileName: resolvedModule.resolvedFileName };
          }

          resolvedPath = join(
            host.getCurrentDirectory(),
            'node_modules',
            resolvedPath
          );
        }
      }
      if (host.fileExists(resolvedPath + '.ts')) {
        return { resolvedFileName: host.realpath!(resolvedPath + '.ts') };
      }
      if (host.fileExists(resolvedPath + '.d.ts')) {
        return { resolvedFileName: host.realpath!(resolvedPath + '.d.ts') };
      }
      return undefined!;
    });
  };
}
