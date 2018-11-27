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
    const managed = this.findManagedComponents(this.decoratorsSoureFile);

    const containers = this.findContainers(this.decoratorsSoureFile);
    if (containers.length === 0) {
      throw new Error('No declared containers found.');
    }

    const builder = containers.map(containerNode => {
      const container = new Container(containerNode, this.navigation);
      this.addExternalComponents(containers, container, managed);

      container.validate();

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
    containers: ts.ClassDeclaration[],
    container: Container,
    managed: ts.ClassDeclaration[]
  ): void {
    const externals =
      containers.length === 1
        ? managed.map(external => new Component(external, this.navigation))
        : this.getExternalsForContainer(managed, container);
    externals.forEach(external => {
      container.addManagedDependency(external);
    });
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
