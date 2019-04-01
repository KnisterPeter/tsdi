import { readFileSync } from 'fs';
import { dirname } from 'path';
import { ts } from 'ts-morph';
import { RunningScriptOptions } from 'vm';
import { Container } from './container';
import { Compiler } from './index';

export class Runtime {
  private readonly transpileOptions: ts.TranspileOptions;

  private readonly containerRequireCache: { [name: string]: any } = {};

  constructor(compiler: Compiler) {
    this.transpileOptions = {
      compilerOptions: compiler.project.compilerOptions.get()
    };
  }

  /**
   * @internal
   */
  public createContainer<T>(container: Container<T>): T {
    const output = ts.transpileModule(container.code, this.transpileOptions);
    const code = output.outputText;

    const evaluatedExports = this.evaluateModule(
      code,
      `<${container.implName}.ts>`,
      {
        lineOffset: 2
      },
      {}
    );

    const constructor: { new (): T } = evaluatedExports[container.implName];
    return new constructor();
  }

  public require(id: string, from: string): any {
    const resolvedId = require.resolve(id, {
      paths: [dirname(from)]
    });
    if (resolvedId.endsWith('.js')) {
      return require(resolvedId);
    }

    if (this.containerRequireCache[resolvedId] !== undefined) {
      return this.containerRequireCache[resolvedId];
    }
    this.containerRequireCache[resolvedId] = {};

    const code = ts.transpileModule(
      readFileSync(resolvedId).toString(),
      this.transpileOptions
    ).outputText;
    this.evaluateModule(
      code,
      resolvedId,
      {},
      this.containerRequireCache[resolvedId]
    );

    return this.containerRequireCache[resolvedId];
  }

  private evaluateModule(
    code: string,
    filename: string,
    options: RunningScriptOptions = {},
    exports: {}
  ): {
    [name: string]: new () => any;
  } {
    const { runInNewContext }: typeof import('vm') = require('vm');
    const { wrap }: typeof import('module') = require('module');

    const sandbox: {
      console: typeof console;
      process: typeof process;
      global: typeof global;
      require: any;
      exports: { [name: string]: { new (): any } };
      module: {
        exports: { [name: string]: { new (): any } };
        id: string;
      };
    } = {
      console,
      process,
      global,
      require: (id: string) => this.require(id, sandbox.module.id),
      exports,
      module: {
        exports,
        id: filename
      }
    };
    runInNewContext(
      `${wrap(code).replace(/;$/, '')}(exports, require, module);`,
      sandbox,
      {
        filename,
        ...options
      }
    );
    return sandbox.exports;
  }
}
