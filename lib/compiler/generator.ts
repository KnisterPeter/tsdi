import * as prettier from 'prettier';
import {
  Directory,
  GetAccessorDeclarationStructure,
  ImportDeclarationStructure,
  Scope
} from 'ts-morph';
import { Component } from './component';
import { Container } from './container';
import { Compiler } from './index';
import { Unit } from './unit';

type ImportTracker = (name: string | [string, string]) => string;

function writeArray(fn: () => string[]): string {
  return `[${fn().join(',')}]`;
}

function writeObject(fn: string | (() => string)): string {
  return `{${typeof fn === 'string' ? fn : fn()}}`;
}

function writeProperty(key: string, value: string | (() => string)): string {
  return `${key}: ${typeof value === 'string' ? value : value()},`;
}

function writePropertyIf(
  condition: any,
  key: string,
  value: () => string
): string {
  return condition ? writeProperty(key, value) : '';
}

export class Generator {
  constructor(private readonly compiler: Compiler) {}

  public createContainer(
    container: Container<any>,
    targetDirectoryPath: string
  ): string {
    const targetDirectory = this.compiler.project.createDirectory(
      targetDirectoryPath
    );

    const imports = this.getImports(container, targetDirectory);
    const trackedImports: Set<string> = new Set();
    const trackImport = (name: string | [string, string]) => {
      if (Array.isArray(name)) {
        if (name[0] === name[1]) {
          trackedImports.add(name[1]);
        }
        return name[0];
      } else {
        trackedImports.add(name);
      }
      return name;
    };

    const sourceFile = targetDirectory.createSourceFile(
      '__tsdi-temp-container-file.ts'
    );

    sourceFile.addClass({
      name: container.implName,
      isExported: true,
      extends: trackImport(container.importName),
      properties: [
        {
          scope: Scope.Private,
          isReadonly: true,
          name: '_tsdi',
          type: 'TSDI'
        }
      ],
      ctors: [
        {
          parameters: [{ name: 'impl', initializer: 'TSDI' }],
          bodyText: writer => {
            writer.writeLine('super()');
            writer.writeLine(
              `this._tsdi = new impl(${trackImport(container.importName)});`
            );
            container.components.forEach(component => {
              if (component.name === 'TSDI') {
                return;
              }
              writer.writeLine(
                this.writeComponentConfiguration(component, trackImport)
              );
            });
          }
        }
      ],
      getAccessors: container.entryPoints.map<GetAccessorDeclarationStructure>(
        (entry: { name: string; type: Component }) => ({
          scope: Scope.Public,
          name: entry.name,
          returnType: trackImport(entry.type.importName),
          bodyText: writer => {
            writer.writeLine(
              `return this._tsdi.get(${trackImport(entry.type.symbol)});`
            );
          }
        })
      ),
      methods: [
        {
          scope: Scope.Public,
          name: 'close',
          returnType: 'void',
          bodyText: `this._tsdi.close();`
        }
      ]
    });

    sourceFile.addImportDeclarations([
      {
        namedImports: [
          {
            name: 'TSDI'
          }
        ],
        moduleSpecifier: 'tsdi'
      },
      ...Object.keys(imports).map<ImportDeclarationStructure>(importPath => ({
        namedImports: imports[importPath]
          .filter(names => trackedImports.has(names[1]))
          .map(names => ({
            name: names[0],
            alias: names[1]
          })),
        moduleSpecifier: importPath
      }))
    ]);

    try {
      return prettier.format('// tslint:disable\n' + sourceFile.print(), {
        ...prettier.resolveConfig.sync(this.compiler.tsConfigFilePath),
        ...{ parser: 'typescript' }
      });
    } finally {
      sourceFile.deleteImmediatelySync();
    }
  }

  private getComponentInfo(
    container: Container<any>,
    targetDirectory: Directory
  ): {
    component: Component | Unit;
    name: string;
    importPath: string;
  }[] {
    return container.components.reduce(
      (infos, component) => {
        const list = [...infos];
        const provider = component.configuration.provider;
        if (provider) {
          list.push({
            component: provider.unit,
            name: provider.class,
            importPath: targetDirectory.getRelativePathAsModuleSpecifierTo(
              provider.unit.node.getSourceFile()
            )
          });
        }
        if (component.constructorDependencies) {
          component.constructorDependencies.forEach(dependency => {
            list.push({
              component: dependency.type,
              name: dependency.type.name,
              importPath: targetDirectory.getRelativePathAsModuleSpecifierTo(
                dependency.type.node.getSourceFile()
              )
            });
          });
        }
        if (component.propertyDependencies) {
          component.propertyDependencies.forEach(dependency => {
            list.push({
              component: dependency.type,
              name: dependency.type.name,
              importPath: targetDirectory.getRelativePathAsModuleSpecifierTo(
                dependency.type.node.getSourceFile()
              )
            });
          });
        }
        list.push({
          component,
          name: component.name,
          importPath: targetDirectory.getRelativePathAsModuleSpecifierTo(
            component.node.getSourceFile()
          )
        });
        return list;
      },
      [] as { component: Component | Unit; name: string; importPath: string }[]
    );
  }

  private getImports(
    container: Container<any>,
    targetDirectory: Directory
  ): { [x: string]: string[][] } {
    const containerImportSpecifier = targetDirectory.getRelativePathAsModuleSpecifierTo(
      container.clazz.getSourceFile()
    );

    const componentInfo = this.getComponentInfo(container, targetDirectory);

    const imports = {
      [containerImportSpecifier]: [[container.name, container.importName]]
    };
    componentInfo.forEach(entry => {
      if (entry.name === 'TSDI') {
        return;
      }
      if (!imports[entry.importPath]) {
        imports[entry.importPath] = [];
      }
      if (
        !imports[entry.importPath].find(
          data => data[1] === entry.component.importName
        )
      ) {
        imports[entry.importPath].push([
          entry.name,
          entry.component.importName
        ]);
      }
    });

    return imports;
  }

  private writeComponentConfiguration(
    component: Component,
    trackImport: ImportTracker
  ): string {
    const config = component.configuration;
    return `this._tsdi.configure(${trackImport(
      component.symbol
    )}, ${writeObject(`
        ${this.writeComponentProvider(config, trackImport)}
        ${this.writeComponentConstructorDependencies(config, trackImport)}
        ${this.writeComponentPropertyDependencies(config, trackImport)}
        ${this.writeComponentMeta(config)}
        ${writePropertyIf(
          config.initializer,
          'initializer',
          () => `'${config.initializer!}'`
        )}
        ${writePropertyIf(
          config.disposer,
          'disposer',
          () => `'${config.disposer!}'`
        )}
      `)});
    `;
  }

  private writeComponentProvider(
    config: Component['configuration'],
    trackImport: ImportTracker
  ): string {
    return writePropertyIf(config.provider, 'provider', () =>
      writeObject(`
      ${writeProperty('class', trackImport(config.provider!.unit.importName))}
      ${writeProperty('method', `'${config.provider!.method}'`)}
      ${writeProperty(
        'dependencies',
        writeArray(() => config.provider!.dependencies.map(trackImport))
      )}
    `)
    );
  }

  private writeComponentConstructorDependencies(
    config: Component['configuration'],
    trackImport: ImportTracker
  ): string {
    return writePropertyIf(
      config.constructorDependencies,
      'constructorDependencies',
      () => writeArray(() => config.constructorDependencies!.map(trackImport))
    );
  }

  private writeComponentPropertyDependencies(
    config: Component['configuration'],
    trackImport: ImportTracker
  ): string {
    return writePropertyIf(
      config.propertyDependencies,
      'propertyDependencies',
      () =>
        writeArray(() =>
          config.propertyDependencies.map(dependency =>
            writeObject(`
              ${writeProperty('property', `'${dependency.property}'`)}
              ${writeProperty('type', trackImport(dependency.type))}
              ${writePropertyIf(dependency.meta, 'meta', () =>
                writeObject(`
                  ${writePropertyIf(
                    dependency.meta!.lazy !== undefined,
                    'lazy',
                    () => String(dependency.meta!.lazy)
                  )}
                `)
              )}
            `)
          )
        )
    );
  }

  private writeComponentMeta(config: Component['configuration']): string {
    return writePropertyIf(config.meta, 'meta', () =>
      writeObject(`
      ${writePropertyIf(config.meta!.singleton !== undefined, 'singleton', () =>
        String(config.meta!.singleton)
      )}
      ${writePropertyIf(config.meta!.scope !== undefined, 'scope', () =>
        String(config.meta!.scope)
      )}
      ${writePropertyIf(config.meta!.eager !== undefined, 'eager', () =>
        String(config.meta!.eager)
      )}
    `)
    );
  }
}
