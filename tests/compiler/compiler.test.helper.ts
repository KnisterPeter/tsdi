import { join } from 'path';
import * as ts from 'typescript';
import { createContext, Script } from 'vm';
import { Compiler } from '../../lib/compiler/compiler';
import { findTsdiRoot } from '../../lib/compiler/utils';

declare global {
  namespace jest {
    interface Matchers<R> {
      toContainsCode(code: string): void;
    }
  }
}

expect.extend({
  toContainsCode(
    received: string,
    argument: string
  ): ReturnType<jest.ExpectExtendMap[0]> {
    const normalize = (str: string) => str.replace(/\s+/g, ' ');

    const pass = normalize(received).includes(normalize(argument));
    return {
      message: () =>
        `expected should ${received} ${pass ? 'not ' : ' '}contain ${argument}`,
      pass
    };
  }
});

async function getTestLanguageSerivce(files: {
  [name: string]: string;
}): Promise<ts.LanguageService> {
  const root = await findTsdiRoot();
  const decoratorsFile = join(root, 'lib', 'compiler', 'decorators.ts');
  files['/decorators.ts'] = ts.sys.readFile(decoratorsFile)!;

  const options = ts.getDefaultCompilerOptions();
  options.experimentalDecorators = true;

  return ts.createLanguageService(
    {
      getScriptFileNames: () => Object.keys(files),
      getDefaultLibFileName: () => ts.getDefaultLibFileName(options),
      getCurrentDirectory: () => '/',
      getCompilationSettings: () => options,
      getScriptVersion: _ => '0',
      getScriptSnapshot: fileName => {
        if (files[fileName]) {
          return ts.ScriptSnapshot.fromString(files[fileName]);
        } else if (fileName === decoratorsFile) {
          return ts.ScriptSnapshot.fromString(ts.sys.readFile(decoratorsFile)!);
        } else if (fileName.endsWith('.d.ts')) {
          try {
            return ts.ScriptSnapshot.fromString(
              ts.sys.readFile(require.resolve(`typescript/lib/${fileName}`))!
            );
          } catch {
            return ts.ScriptSnapshot.fromString(
              ts.sys.readFile(
                require.resolve(`typescript/lib/lib.${fileName}`)
              )!
            );
          }
        }
        return undefined;
      }
    },
    ts.createDocumentRegistry()
  );
}

export async function runCompiler(files: {
  [name: string]: string;
}): Promise<string> {
  return new Promise<string>(async resolve => {
    const service = await getTestLanguageSerivce(files);
    const compiler = Compiler.create(
      {
        writeFile: (_, data) => resolve(data)
      },
      service
    );
    await compiler.run('/decorators.ts');
  });
}

export async function testContainer(
  code: string,
  files: { [name: string]: string },
  expect: jest.Expect
): Promise<boolean> {
  const root = await findTsdiRoot();

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
    new Script(moduleCode).runInContext(context);
    return sandbox.exports;
  };

  const moduleCache: { [id: string]: any } = {};
  const customRequire = (id: string) => {
    if (id === 'tsdi') {
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

      (async () => {
        const container = await TSDI.start(TSDIContainer);
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
      })().catch(e => {
        reject(e);
      });
    `);
    new Script(script).runInNewContext({
      expect,
      require: customRequire,
      module: { exports: {} },
      exports: {},
      resolve,
      reject
    });
  });
}
