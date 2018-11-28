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
              console.log(path);
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

export async function testContainer(
  code: string,
  files: { [name: string]: string },
  expect: jest.Expect
): Promise<boolean> {
  const root = findTsdiRoot();

  const transpile = (input: string) =>
    ts.transpileModule(input, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2015,
        module: ts.ModuleKind.CommonJS,
        experimentalDecorators: true
      }
    }).outputText;

  const evaluate = (code: string) => {
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
    return sandbox.exports;
  };

  const moduleCache: { [id: string]: any } = {};
  // tslint:disable-next-line:cyclomatic-complexity
  const customRequire = (id: string) => {
    if (id === 'tsdi' || id === '../tsdi') {
      return require('../../lib');
    }
    if (id === '/decorators') {
      const decoratorsFile = join(root, 'lib', 'compiler', 'decorators.ts');
      return evaluate(ts.sys.readFile(decoratorsFile)!);
    }
    if (id.startsWith('./')) {
      id = id.substr(1);
      if (files[id + '.ts']) {
        if (moduleCache[id]) {
          return moduleCache[id];
        }
        return (moduleCache[id] = evaluate(files[id + '.ts']));
      }
    }
    throw new Error(`id ${id} not found`);
  };

  return new Promise<boolean>((resolve, reject) => {
    const script = transpile(`
      ${code}

      const container = new TSDIContainer();
      try {
        const result = container.test(expect);
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
      require: customRequire,
      module: { exports: {} },
      exports: {},
      resolve,
      reject,
      console
    });
  });
}
