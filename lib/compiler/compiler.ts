import { dirname, join } from 'path';
import * as ts from 'typescript';
import { Generator } from './generator';
import { Navigation } from './navigation';
import {
  filter,
  findClosestClass,
  findClosestDecoratedNode,
  findTsdiRoot,
  getConstructor,
  getDecorator,
  getDecoratorParameters,
  getValueFromObjectLiteral,
  hasDecorator,
  isAbstract
} from './utils';

/**
 * @internal
 */
export interface Component {
  type: ts.ClassDeclaration;
  provider?: {
    class: ts.ClassDeclaration;
    method: string;
    parameters: ts.ClassDeclaration[];
  };
  constructorDependencies: ts.ClassDeclaration[];
  propertyDependencies: { property: string; type: ts.ClassDeclaration }[];
  meta: {
    singleton?: boolean;
  };
}

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
      resolveModuleNames: (
        moduleNames: string[],
        containingFile: string
      ): ts.ResolvedModule[] => {
        return moduleNames.map(moduleName => {
          let modulePath = moduleName;
          if (!modulePath.startsWith('/')) {
            if (modulePath.startsWith('.')) {
              modulePath = join(dirname(containingFile), modulePath);
            } else {
              modulePath = join(
                ts.sys.getCurrentDirectory(),
                'node_modules',
                modulePath
              );
            }
          }
          if (ts.sys.fileExists(modulePath + '.d.ts')) {
            return { resolvedFileName: ts.sys.realpath!(modulePath + '.d.ts') };
          } else if (ts.sys.fileExists(modulePath + '.ts')) {
            return { resolvedFileName: ts.sys.realpath!(modulePath + '.ts') };
          }
          return undefined!;
        });
      }
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
    const containers = await this.findContainers(this.decoratorsSoureFile);
    if (containers.length === 0) {
      throw new Error('No declared containers found.');
    }

    const builder = await Promise.all(
      containers.map(async container => {
        try {
          const members = filter(container.members, isAbstract);

          const components: Map<ts.ClassDeclaration, Component> = new Map();
          const dependencyQueue: ts.ClassDeclaration[] = [
            ...(await this.findDependencies(members))
          ];

          const units = await this.getContainerUnits(container);
          units.forEach(unit => dependencyQueue.push(unit));
          await this.handleProvides(units, components, dependencyQueue);

          while (dependencyQueue.length > 0) {
            const dependency = dependencyQueue.shift();
            if (!dependency) {
              break;
            }

            await this.handleDependency(
              dependency,
              components,
              dependencyQueue
            );
          }

          return this.generator
            .buildContainer(container)
            .addAbstractMembers(members)
            .addComponents(...Array.from(components.values()));
        } catch (e) {
          console.error(e);
          throw e;
        }
      })
    );
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

  private async handleProvides(
    units: ts.ClassDeclaration[],
    components: Map<ts.ClassDeclaration, Component>,
    dependencyQueue: ts.ClassDeclaration[]
  ): Promise<void> {
    await Promise.all(
      units.map(async unit => {
        await Promise.all(
          unit.members.map(async member => {
            if (ts.isMethodDeclaration(member)) {
              const provides = getDecorator('provides', member);
              if (provides) {
                // -- is singleton?
                const singleton = (() => {
                  const parameters = getDecoratorParameters(provides);
                  if (parameters.length > 0) {
                    // per type signature first parameter of provides is always
                    // object literal expression
                    const config = parameters[0] as ts.ObjectLiteralExpression;

                    const singleton = getValueFromObjectLiteral(
                      config,
                      'singleton'
                    );
                    return singleton.kind !== ts.SyntaxKind.FalseKeyword;
                  }
                  return true;
                })();
                // /- is singleton?

                const parameterTypes = await this.getMethodParameterTypes(
                  member
                );
                const returnType = await this.getMethodReturnType(member);
                parameterTypes.forEach(parameter =>
                  dependencyQueue.push(parameter)
                );
                dependencyQueue.push(returnType);
                if (!components.has(returnType)) {
                  const component: Component = {
                    type: returnType,
                    constructorDependencies: [],
                    propertyDependencies: [],
                    meta: {
                      singleton
                    }
                  };
                  components.set(returnType, component);
                }
                components.get(returnType)!.provider = {
                  class: unit,
                  method: member.name.getText(),
                  parameters: parameterTypes
                };
              }
            }
          })
        );
      })
    );
  }

  private async handleDependency(
    dependency: ts.ClassDeclaration,
    components: Map<ts.ClassDeclaration, Component>,
    dependencyQueue: ts.ClassDeclaration[]
  ): Promise<void> {
    if (!components.has(dependency)) {
      components.set(dependency, {
        type: dependency,
        constructorDependencies: [],
        propertyDependencies: [],
        meta: {}
      });
    }
    const component = components.get(dependency)!;

    if (hasDecorator('managed', dependency)) {
      const constructor = getConstructor(dependency);
      if (constructor) {
        await Promise.all(
          constructor.parameters.map(async parameter => {
            const dependency = findClosestClass(
              await this.navigation.findDefinition(parameter)
            );
            dependencyQueue.push(dependency);
            component.constructorDependencies.push(dependency);
          })
        );
      }
    }

    this.handleMeta(dependency, component);

    await Promise.all(
      dependency.members.map(async member => {
        if (!ts.isPropertyDeclaration(member)) {
          return;
        }

        if (hasDecorator('managed', member)) {
          const definition = findClosestClass(
            await this.navigation.findDefinition(member)
          );

          dependencyQueue.push(definition);

          const propertyName = member.name.getText();
          component.propertyDependencies.push({
            property: propertyName,
            type: definition
          });
        }
      })
    );
  }

  private handleMeta(
    dependency: ts.ClassDeclaration,
    component: Component
  ): void {
    const meta = getDecorator('meta', dependency);
    if (meta) {
      const parameters = getDecoratorParameters(meta);

      // per type signature first parameter of meta is always object literal expression
      const config = parameters[0] as ts.ObjectLiteralExpression;

      const singleton = getValueFromObjectLiteral(config, 'singleton');
      if (singleton.kind === ts.SyntaxKind.FalseKeyword) {
        component.meta.singleton = false;
      } else {
        component.meta.singleton = true;
      }
    }
  }

  private async findContainers(
    decoratorsSoureFile: string
  ): Promise<ts.ClassDeclaration[]> {
    const containerFunction = this.navigation.findFunction(
      decoratorsSoureFile,
      'container'
    );
    const containerDecorators = await this.navigation.findUsages(
      containerFunction
    );

    return containerDecorators
      .map(decorator => findClosestDecoratedNode(decorator))
      .map(container => {
        return container as ts.ClassDeclaration;
      });
  }

  private async findDependencies(
    members: ReadonlyArray<ts.ClassElement>
  ): Promise<ts.ClassDeclaration[]> {
    const tasks = members.map(async member => {
      if (ts.isPropertyDeclaration(member)) {
        return findClosestClass(await this.navigation.findDefinition(member));
      }
      throw new Error(`Unknown class element ${member}`);
    });

    return Promise.all(tasks);
  }

  private async getMethodParameterTypes(
    node: ts.MethodDeclaration
  ): Promise<ts.ClassDeclaration[]> {
    return Promise.all(
      node.parameters.map(async parameter => {
        return findClosestClass(
          await this.navigation.findDefinition(parameter)
        );
      })
    );
  }

  private async getMethodReturnType(
    node: ts.MethodDeclaration
  ): Promise<ts.ClassDeclaration> {
    if (!node.type) {
      throw new Error(
        `@provides requires methods to declare a return type '${node.getText()}`
      );
    }
    let type: ts.Node = node.type;
    if (ts.isTypeReferenceNode(type)) {
      type = type.typeName;
    }
    if (!ts.isIdentifier(type)) {
      throw new Error(`${type.getText()} is an unsupported type declartaion`);
    }

    return findClosestClass(await this.navigation.findDefinition(type));
  }

  private async getContainerUnits(
    node: ts.ClassDeclaration
  ): Promise<ts.ClassDeclaration[]> {
    const parameters = getDecoratorParameters(node.decorators![0]);
    // per type signature first parameter of container is always
    // object literal expression
    const config = parameters[0] as ts.ObjectLiteralExpression;

    // per type signature units is always array literal expression
    const unitsArray = getValueFromObjectLiteral(
      config,
      'units'
    ) as ts.ArrayLiteralExpression;

    const unitIdentifiers = unitsArray.elements.map(element => {
      if (!ts.isIdentifier(element)) {
        throw new Error(
          'Invalid @container decorator: units need to be identifiers'
        );
      }
      return element;
    });

    return Promise.all(
      unitIdentifiers.map(async unitIdentifier => {
        return findClosestClass(
          await this.navigation.findDefinition(unitIdentifier)
        );
      })
    );
  }
}
