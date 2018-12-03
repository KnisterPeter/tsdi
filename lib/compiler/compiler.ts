import { dirname, join } from 'path';
import * as ts from 'typescript';
import { Generator } from './generator';
import { CompilerHost } from './host';
import { createResolver } from './module-resolver';
import { Navigation } from './navigation';
import { Component, Container } from './types';
import {
  findClosestClass,
  findClosestDecoratedNode,
  findTsdiRoot,
  getDecorator,
  getDecoratorParameters,
  getValueFromObjectLiteral,
  hasDecorator
} from './utils';

export class Compiler {
  public static create(
    host: CompilerHost,
    root = host.getCurrentDirectory()
  ): Compiler {
    const configFile = ts.findConfigFile(root, host.fileExists);
    if (!configFile) {
      throw new Error('Unable to find tsconfig.json');
    }

    const cmdline = ts.getParsedCommandLineOfConfigFile(
      configFile,
      {},
      host as any
    );
    if (!cmdline) {
      throw new Error('Unable to parse config file');
    }
    if (cmdline.errors && cmdline.errors.length > 0) {
      console.error(
        ts.formatDiagnostics(ts.getConfigFileParsingDiagnostics(cmdline), {
          getCanonicalFileName: fileName => fileName,
          getCurrentDirectory: host.getCurrentDirectory,
          getNewLine: () => '\n'
        })
      );
      throw new Error('Errors in config file setup');
    }

    const languageService = Compiler.createLanguageService(cmdline, host);
    return new Compiler(host, languageService);
  }

  private static createLanguageService(
    cmdline: ts.ParsedCommandLine,
    host: CompilerHost
  ): ts.LanguageService {
    return ts.createLanguageService({
      getScriptFileNames: () => cmdline.fileNames,
      getDefaultLibFileName: () => ts.getDefaultLibFileName(cmdline.options),
      getCurrentDirectory: () => host.getCurrentDirectory(),
      getCompilationSettings: () => cmdline.options,
      getScriptVersion: _ => '0',
      getScriptSnapshot: fileName => {
        const code = host.readFile(fileName);
        if (!code) {
          return undefined;
        }
        return ts.ScriptSnapshot.fromString(code);
      },
      resolveModuleNames: createResolver(host)
    });
  }

  private readonly navigation: Navigation;

  private readonly generator: Generator;

  private constructor(
    private readonly host: CompilerHost,
    private readonly services: ts.LanguageService
  ) {
    this.navigation = new Navigation(this.services);

    // // enable to output diagnostics
    // const diag = [
    //   ...this.services.getProgram()!.getGlobalDiagnostics(),
    //   ...this.services.getProgram()!.getSyntacticDiagnostics(),
    //   ...this.services.getProgram()!.getSemanticDiagnostics()
    // ];
    // console.log(
    //   ts.formatDiagnostics(diag, {
    //     getCanonicalFileName: path => path,
    //     getCurrentDirectory: ts.sys.getCurrentDirectory,
    //     getNewLine: () => '\n'
    //   })
    // );
    // throw new Error('Failed to compile');

    this.generator = new Generator();
  }

  public async run(): Promise<void> {
    const containerNodes = this.findContainers();
    if (containerNodes.length === 0) {
      throw new Error('No declared containers found.');
    }

    const containers = containerNodes.map(node => {
      const container = new Container(node, this.navigation);
      container.validate();
      return container;
    });

    const managed = this.findManagedComponents();
    const legacyExternals = this.findLegacyExternals();
    this.addExternalComponents(containers, [...managed, ...legacyExternals]);

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
      const unassignedExternals = managed
        .filter(node => {
          // legacy decorators
          if (
            hasDecorator('External', node) ||
            hasDecorator('external', node)
          ) {
            return true;
          }
          const parameters = getDecoratorParameters(
            getDecorator('managed', node)!
          );
          if (parameters.length === 0) {
            return true;
          }
          return !Boolean(
            getValueFromObjectLiteral(
              parameters[0] as ts.ObjectLiteralExpression,
              'by'
            )
          );
        })
        .filter(node => {
          // todo: filter TSDI by reference instead of name
          return node.name && node.name.getText() !== 'TSDI';
        })
        .filter(node => {
          return containers.reduce((result, container) => {
            return (
              result &&
              container.managed.every(managed => managed.type !== node)
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

  private findContainers(): ts.ClassDeclaration[] {
    const containerFunction = this.navigation.findFunction(
      this.findTsdiFile('decorators'),
      'container'
    );
    const containerDecorators = this.navigation.findUsages(containerFunction);

    return containerDecorators
      .map(decorator => findClosestDecoratedNode(decorator))
      .map(container => {
        return container as ts.ClassDeclaration;
      });
  }

  private findManagedComponents(): ts.ClassDeclaration[] {
    const managedFunction = this.navigation.findFunction(
      this.findTsdiFile('decorators'),
      'managed'
    );
    const managedDecorators = this.navigation
      .findUsages(managedFunction)
      .filter((node): node is ts.Decorator => ts.isDecorator(node.parent));

    return [...managedDecorators]
      .map(decorator => findClosestDecoratedNode(decorator))
      .map(node => findClosestClass(node));
  }

  private findLegacyExternals(): ts.ClassDeclaration[] {
    const externalFunction1 = this.navigation.findNamedExport(
      this.findTsdiFile('external').fileName,
      'External'
    );
    const externalDecorators1 = this.navigation
      .findUsages(externalFunction1)
      .filter((node): node is ts.Decorator => ts.isDecorator(node.parent));

    const externalFunction2 = this.navigation.findNamedExport(
      this.findTsdiFile('external').fileName,
      'external'
    );
    const externalDecorators2 = this.navigation
      .findUsages(externalFunction2)
      .filter((node): node is ts.Decorator => ts.isDecorator(node.parent));

    // legacy factory
    const factoryFunction = this.navigation.findNamedExport(
      this.findTsdiFile('component').fileName,
      'component'
    );
    const factoryDecorators = this.navigation
      .findUsages(factoryFunction)
      .filter((node): node is ts.Decorator => ts.isDecorator(node.parent))
      .filter(node => {
        const clazz = findClosestClass(node);
        return clazz.members
          .filter(
            (member): member is ts.MethodDeclaration =>
              ts.isMethodDeclaration(member)
          )
          .some(member => hasDecorator('factory', member));
      });

    return [
      ...externalDecorators1,
      ...externalDecorators2,
      ...factoryDecorators
    ]
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

  private findTsdiFile(name: string): ts.SourceFile {
    const sourceFile = this.services
      .getProgram()!
      .getSourceFiles()
      .find(sourceFile => {
        return (
          sourceFile.fileName.startsWith(findTsdiRoot()) &&
          sourceFile.fileName.indexOf(name) !== -1
        );
      });
    if (!sourceFile) {
      throw new Error(`No file found with '${name}' in its name.`);
    }
    return sourceFile;
  }
}
