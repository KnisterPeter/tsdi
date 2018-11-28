import { dirname, join } from 'path';
import * as ts from 'typescript';
import { Generator } from './generator';
import { resolver } from './module-resolver';
import { Navigation } from './navigation';
import { Component, Container } from './types';
import {
  findClosestClass,
  findClosestDecoratedNode,
  findTsdiRoot,
  getDecorator,
  getDecoratorParameters,
  getValueFromObjectLiteral
} from './utils';

export interface CompilerHost {
  writeFile(fileName: string, data: string): void;
}

export class Compiler {
  public static create(
    host: CompilerHost,
    root = '.',
    decoratorsSoureFile = join(
      findTsdiRoot(),
      'dist',
      'lib',
      'compiler',
      'decorators.d.ts'
    ),
    languageService = Compiler.createLanguageService(root)
  ): Compiler {
    return new Compiler(host, decoratorsSoureFile, languageService);
  }

  private static createLanguageService(root: string): ts.LanguageService {
    const configFile = ts.findConfigFile(
      root || process.cwd(),
      ts.sys.fileExists
    );
    if (!configFile) {
      throw new Error('Unable to find tsconfig.json');
    }

    const cmdline = ts.getParsedCommandLineOfConfigFile(
      configFile,
      {},
      ts.sys as any
    );
    if (!cmdline) {
      throw new Error('Unable to parse config file');
    }

    return ts.createLanguageService({
      getScriptFileNames: () => cmdline.fileNames,
      getDefaultLibFileName: () => ts.getDefaultLibFileName(cmdline.options),
      getCurrentDirectory: () => process.cwd(),
      getCompilationSettings: () => cmdline.options,
      getScriptVersion: _ => '0',
      getScriptSnapshot: fileName => {
        const code = ts.sys.readFile(fileName);
        if (!code) {
          return undefined;
        }
        return ts.ScriptSnapshot.fromString(code);
      },
      resolveModuleNames: resolver
    });
  }

  private readonly navigation: Navigation;

  private readonly generator: Generator;

  private constructor(
    private readonly host: CompilerHost,
    private readonly decoratorsSoureFile: string,
    private readonly services: ts.LanguageService
  ) {
    this.navigation = new Navigation(this.services);
    this.generator = new Generator();
  }

  public async run(): Promise<void> {
    const containerNodes = this.findContainers(this.decoratorsSoureFile);
    if (containerNodes.length === 0) {
      throw new Error('No declared containers found.');
    }

    const containers = containerNodes.map(node => {
      const container = new Container(node, this.navigation);
      container.validate();
      return container;
    });

    const managed = this.findManagedComponents(this.decoratorsSoureFile);
    this.addExternalComponents(containers, managed);

    const builder = containers.map(container => {
      return this.generator
        .buildContainer(container.node)
        .addAbstractMembers(container.entryPoints)
        .addComponents(...container.managed);
    });

    await Promise.all(
      builder.map(async builder => {
        const name = `tsdi-${builder.base.name!.getText().toLowerCase()}.ts`;
        this.host.writeFile(
          join(dirname(builder.base.getSourceFile().fileName), name),
          await builder.build()
        );
      })
    );
  }

  private addExternalComponents(
    containers: Container[],
    managed: ts.ClassDeclaration[]
  ): void {
    if (containers.length === 1) {
      const container = containers[0];
      const externals = managed
        .filter(node =>
          container.managed.every(managed => managed.type !== node)
        )
        .map(node => new Component(node, this.navigation));
      externals.forEach(external => {
        container.addManagedDependency(external);
      });
    } else {
      const unassignedExternals = managed.filter(node => {
        return containers.reduce((result, container) => {
          return (
            result && container.managed.every(managed => managed.type !== node)
          );
        }, true);
      });
      if (unassignedExternals.length > 0) {
        const names = unassignedExternals
          .map(node => node.name!.getText())
          .join(', ');
        throw new Error(
          `Unassigned externals [${names}] are not supported if using multiple containers`
        );
      }

      containers.forEach(container => {
        const externals = this.getExternalsForContainer(managed, container);
        externals.forEach(external => {
          container.addManagedDependency(external);
        });
      });
    }
  }

  private findContainers(decoratorsSoureFile: string): ts.ClassDeclaration[] {
    const containerFunction = this.navigation.findFunction(
      decoratorsSoureFile,
      'container'
    );
    const containerDecorators = this.navigation.findUsages(containerFunction);

    return containerDecorators
      .map(decorator => findClosestDecoratedNode(decorator))
      .map(container => {
        return container as ts.ClassDeclaration;
      });
  }

  private findManagedComponents(
    decoratorsSoureFile: string
  ): ts.ClassDeclaration[] {
    const managedFunction = this.navigation.findFunction(
      decoratorsSoureFile,
      'managed'
    );
    const managedDecorators = this.navigation.findUsages(managedFunction);

    return managedDecorators
      .map(decorator => findClosestDecoratedNode(decorator))
      .map(node => findClosestClass(node));
  }

  private getExternalsForContainer(
    externals: ts.ClassDeclaration[],
    container: Container
  ): Component[] {
    return externals
      .filter(external => {
        const externalDecorator = getDecorator('managed', external)!;

        const parameters = getDecoratorParameters(externalDecorator);
        if (parameters.length > 0) {
          // per type signature first parameter of provides is always
          // object literal expression
          const config = parameters[0] as ts.ObjectLiteralExpression;
          const value = getValueFromObjectLiteral(config, 'by');
          if (value && ts.isIdentifier(value)) {
            const cls = findClosestClass(this.navigation.findDefinition(value));
            return cls === container.node;
          }
        }
        return false;
      })
      .map(external => new Component(external, this.navigation));
  }
}
