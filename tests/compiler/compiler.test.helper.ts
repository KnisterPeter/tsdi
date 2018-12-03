import { join } from 'path';
import * as ts from 'typescript';
import { createContext, Script } from 'vm';
import { Compiler } from '../../lib/compiler/compiler';
import { CompilerHost } from '../../lib/compiler/host';
import { findTsdiRoot } from '../../lib/compiler/utils';

export function getTestEnv(): { host: CompilerHost; fs: TestFs } {
  const fs = createTestFs();
  const host = createTestCompilerHost(fs);
  fs.host = host;
  return { fs, host };
}

export interface TestFs {
  host: CompilerHost;
  files(): string[];
  add(name: string, content: string): void;
  get(name: string): string | undefined;
}

function createTestFs(): TestFs {
  const path = (str: string) =>
    str.startsWith(fs.host.getCurrentDirectory())
      ? str
      : join(fs.host.getCurrentDirectory(), str);
  const files: { [name: string]: string } = {};
  const fs: TestFs = {
    host: undefined as any,
    files: () => Object.keys(files),
    add: (name, content) => {
      files[path(name)] = content;
    },
    get: name => {
      return files[path(name)];
    }
  };
  return fs;
}

const createTestCompilerHost = (fs: TestFs): CompilerHost => {
  const host: CompilerHost = {
    getCurrentDirectory: () => process.cwd(),
    realpath: path => {
      if (path.startsWith('./')) {
        return join(host.getCurrentDirectory(), path).replace('//', '/');
      }
      return path;
    },
    fileExists: path => {
      const exists = Boolean(fs.get(host.realpath!(path)));
      if (!exists) {
        if (path.indexOf('node_modules/tsdi') !== -1) {
          return ts.sys.fileExists(
            path
              .substr(host.getCurrentDirectory().length)
              .replace(/^\/node_modules\/tsdi/, './lib')
          );
        } else if (path.indexOf('node_modules/@types/tsdi') !== -1) {
          return ts.sys.fileExists(
            path
              .substr(host.getCurrentDirectory().length)
              .replace(/^\/node_modules\/tsdi/, './lib')
          );
        }
        if (path.indexOf('node_modules/') !== -1) {
          try {
            return Boolean(
              require.resolve(
                path
                  .substr(host.getCurrentDirectory().length)
                  .replace(/^\/node_modules\//, '')
              )
            );
          } catch (e) {
            // ignore
          }
        }
        // console.warn('fileExists', path);
      }
      return exists;
    },
    // tslint:disable-next-line:cyclomatic-complexity
    readFile: path => {
      if (path.startsWith('lib.') && path.endsWith('.d.ts')) {
        return ts.sys.readFile(require.resolve(`typescript/lib/${path}`));
      }
      if (path === 'lib') {
        return ts.sys.readFile(require.resolve('typescript/lib/lib.d.ts'));
      } else if (path === 'lib.ts') {
        return undefined;
      } else if (path === 'lib.tsx') {
        return undefined;
      }
      if (!host.fileExists(path)) {
        return undefined;
      }
      const content = fs.get(host.realpath!(path));
      if (content === undefined) {
        if (path.indexOf('node_modules/tsdi') !== -1) {
          return ts.sys.readFile(
            path
              .substr(host.getCurrentDirectory().length)
              .replace(/^\/node_modules\/tsdi/, './lib')
          );
        }
        if (path.indexOf('node_modules/') !== -1) {
          try {
            return ts.sys.readFile(
              require.resolve(
                path
                  .substr(host.getCurrentDirectory().length)
                  .replace(/^\/node_modules\//, '')
              )
            );
          } catch (e) {
            // ignore
          }
        }
        console.warn(`Failed to readFile '${path}'`);
      }
      return content;
    },
    readDirectory: path => {
      if (path !== findTsdiRoot()) {
        throw new Error('readDirectory unimplemented');
      }
      return [...fs.files(), 'lib'];
    },
    writeFile: (name, data) => {
      fs.add(name, data);
    }
  };
  return host;
};

export async function runCompiler(
  host: CompilerHost,
  fs: TestFs
): Promise<void> {
  fs.add(
    'tsconfig.json',
    `{
    "compilerOptions": {
      "target": "es5",
      "lib": ["es2017"],
      "module": "commonjs",
      "experimentalDecorators": true,
    }
  }`
  );

  (host as any).onUnRecoverableConfigFileDiagnostic = (
    diagnostic: ts.Diagnostic
  ) => {
    throw new Error(diagnostic.messageText.toString());
  };

  return Compiler.create(host, host.getCurrentDirectory()).run();
}

function transpile(input: string): string {
  return ts.transpileModule(input, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2015,
      module: ts.ModuleKind.CommonJS,
      lib: ['es2017'],
      experimentalDecorators: true
    }
  }).outputText;
}

function createRequire(fs: TestFs): (id: string) => any {
  const moduleCache: { [id: string]: any } = {};
  // tslint:disable-next-line:cyclomatic-complexity
  return function customRequire(id: string): any {
    if (id === 'tsdi' || id === '../tsdi') {
      return require('../../lib');
    }
    if (id.startsWith('tsdi/') || id.startsWith('../tsdi/')) {
      return require(id.replace(/tsdi\//, '../../lib/') + '.ts');
    }
    if (id.startsWith('./')) {
      id = id.substr(2);
      if (fs.get(id + '.ts')) {
        if (moduleCache[id]) {
          return moduleCache[id];
        }
        return (moduleCache[id] = evaluate(fs.get(id + '.ts')!, customRequire));
      }
    }
    throw new Error(`require '${id}' not found`);
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
  fs: TestFs,
  fileNames: string[] = ['tsdi-container'],
  containerNames: string[] = ['TSDIContainer']
): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    const script = transpile(`
      import { test } from './file';
      ${fileNames
        .map(
          (_, idx) =>
            `import { ${containerNames[idx]} } from './${fileNames[idx]}';`
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
      require: createRequire(fs),
      module: { exports: {} },
      exports: {},
      resolve,
      reject,
      console
    });
  });
}
