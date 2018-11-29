import { join } from 'path';
import * as ts from 'typescript';
import { createContext, Script } from 'vm';
import { Compiler } from '../../lib/compiler/compiler';
import { CompilerHost } from '../../lib/compiler/host';
import { findTsdiRoot } from '../../lib/compiler/utils';

const resolveTsdiLibraryPath = (path: string) => {
  return require.resolve(path.replace(/node_modules\//, '').substr(1));
};

const createTestCompilerHost = (files: {
  [name: string]: string;
}): CompilerHost => {
  const host: CompilerHost = {
    getCurrentDirectory: () => '/',
    realpath: path => {
      if (path.startsWith('./')) {
        return join(host.getCurrentDirectory(), path).replace('//', '/');
      }
      return path;
    },
    fileExists: path => {
      const exists = Boolean(files[host.realpath!(path)]);
      if (!exists) {
        try {
          return Boolean(resolveTsdiLibraryPath(path));
        } catch (e) {
          //
        }
      }
      return exists;
    },
    readFile: path => {
      const content = files[host.realpath!(path)];
      if (content === undefined) {
        try {
          return ts.sys.readFile(resolveTsdiLibraryPath(path));
        } catch (e) {
          if (path.endsWith('.d.ts')) {
            try {
              return ts.sys.readFile(require.resolve(`typescript/lib/${path}`));
            } catch {
              return ts.sys.readFile(
                require.resolve(`typescript/lib/lib.${path}`)
              );
            }
          }
          console.log('readFile', path, 'unimplemented');
        }
      }
      return content;
    },
    readDirectory: path => {
      if (path !== '/') {
        throw new Error('unimplemented');
      }
      return Object.keys(files).filter(path => path.indexOf('/', 1) === -1);
    },
    writeFile: (name, data) => {
      files[name] = data;
    }
  };
  return host;
};

export async function runCompiler(files: {
  [name: string]: string;
}): Promise<void> {
  const root = findTsdiRoot();
  const decoratorsFile = join(root, 'lib', 'compiler', 'decorators.ts');
  files['/decorators.ts'] = ts.sys
    .readFile(decoratorsFile)!
    .replace('../tsdi', 'tsdi');
  files['/tsconfig.json'] = `{
    "compilerOptions": {
      "target": "es5",
      "module": "commonjs",
      "experimentalDecorators": true,
    }
  }`;

  const host = createTestCompilerHost(files);
  (host as any).onUnRecoverableConfigFileDiagnostic = (
    diagnostic: ts.Diagnostic
  ) => {
    throw new Error(diagnostic.messageText.toString());
  };

  return Compiler.create(host, '.', '/decorators.ts').run();
}

function transpile(input: string): string {
  return ts.transpileModule(input, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2015,
      module: ts.ModuleKind.CommonJS,
      experimentalDecorators: true
    }
  }).outputText;
}

function createRequire(
  root: string,
  files: { [name: string]: string }
): (id: string) => any {
  const moduleCache: { [id: string]: any } = {};
  // tslint:disable-next-line:cyclomatic-complexity
  return function customRequire(id: string): any {
    if (id === 'tsdi' || id === '../tsdi') {
      return require('../../lib');
    }
    if (id === '/decorators') {
      const decoratorsFile = join(root, 'lib', 'compiler', 'decorators.ts');
      return evaluate(ts.sys.readFile(decoratorsFile)!, customRequire);
    }
    if (id.startsWith('./')) {
      id = id.substr(1);
      if (files[id + '.ts']) {
        if (moduleCache[id]) {
          return moduleCache[id];
        }
        return (moduleCache[id] = evaluate(files[id + '.ts'], customRequire));
      }
    }
    throw new Error(`id ${id} not found`);
  };
}

function evaluate<R = any>(
  code: string,
  customRequire: (id: string) => any
): R {
  const moduleCode = transpile(code);
  const sandbox = {
    console,
    require: customRequire,
    exports: {}
  };
  const context = createContext(sandbox);
  new Script(moduleCode).runInContext(context, {
    displayErrors: true
  });
  return sandbox.exports as R;
}

export async function testContainer(
  files: { [name: string]: string },
  fileNames: string[] = ['/tsdi-container'],
  containerNames: string[] = ['TSDIContainer']
): Promise<boolean> {
  const root = findTsdiRoot();

  return new Promise<boolean>((resolve, reject) => {
    const script = transpile(`
      import { test } from './file';
      ${fileNames
        .map(
          (_, idx) =>
            `import { ${containerNames[idx]} } from '.${fileNames[idx]}';`
        )
        .join('\n')}

      const containers = [
        ${containerNames
          .map(containerName => `new ${containerName}(),`)
          .join('\n')}
      ];
      try {
        const result = test(expect, ...containers);
        if (result && result.then && result.catch) {
          result.then(() => resolve()).catch(e => reject(e));
        } else {
          resolve();
        }
      } catch (e) {
        reject(e);
      }
    `);
    new Script(script).runInNewContext({
      expect,
      require: createRequire(root, files),
      module: { exports: {} },
      exports: {},
      resolve,
      reject,
      console
    });
  });
}
