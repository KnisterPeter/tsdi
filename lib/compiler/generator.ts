import { basename, dirname, relative, sep } from 'path';
import * as prettier from 'prettier';
import * as ts from 'typescript';
import { Component } from './compiler';

export interface ContainerBuilder {
  base: ts.ClassDeclaration;
  /**
   * @internal
   */
  addAbstractMembers(nodes: ReadonlyArray<ts.ClassElement>): this;
  /**
   * @internal
   */
  addComponents(...nodes: Component[]): this;
  build(): Promise<string>;
}

export class Generator {
  public buildContainer(base: ts.ClassDeclaration): ContainerBuilder {
    if (!base.name) {
      throw new Error(
        'Anonymous classes are not valid for container definition'
      );
    }
    const baseName = base.name.text;
    const getter: [string, string][] = [];
    const components: Component[] = [];
    const imports: [string, string][] = [
      [baseName, `.${sep}${basename(base.getSourceFile().fileName)}`]
    ];
    return {
      base,
      addAbstractMembers(nodes: ts.ClassElement[]): any {
        nodes.map(node => {
          if (ts.isPropertyDeclaration(node)) {
            getter.push([node.name.getText(), node.type!.getText()]);
          } else {
            throw new Error('Unknown class element');
          }
        });
        return this;
      },
      addComponents(...nodes: Component[]): any {
        nodes.forEach(node => {
          if (!node.type.name) {
            throw new Error(
              `Anonymous classes as components are not supported`
            );
          }
          components.push(node);
          imports.push([
            node.type.name.getText(),
            `.${sep}${relative(
              dirname(base.getSourceFile().fileName),
              node.type.getSourceFile().fileName
            )}`
          ]);
        });
        return this;
      },
      async build(): Promise<string> {
        return prettier.format(
          `
          // tslint:disable
          //
          // This is a generated file.
          // DO NOT EDIT!
          //
          import { TSDI } from 'tsdi';
          ${imports
            .map(
              ([name, path]) =>
                `import { ${name} } from '${path.replace(/\.tsx?/, '')}';`
            )
            .join('\n')}

          export class TSDI${baseName} extends ${baseName} {
            private readonly tsdi: TSDI;

            constructor() {
              super();
              this.tsdi = new TSDI();
              ${components
                .map(component => {
                  if (!component.type.name) {
                    throw new Error(
                      `Anonymous classes as components are not supported`
                    );
                  }
                  let provider = '';
                  const meta = `{
                    singleton: ${
                      typeof component.meta.singleton === 'boolean'
                        ? component.meta.singleton
                        : true
                    }
                  }`;
                  if (component.provider) {
                    provider = `
                      provider: {
                        class: ${component.provider.class.name!.getText()},
                        method: '${component.provider.method}',
                        dependencies: [${component.provider.parameters
                          .map(parameter => parameter.name!.getText())
                          .join(', ')}]
                      },
                    `;
                  }
                  if (
                    component.constructorDependencies.length === 0 &&
                    component.propertyDependencies.length === 0
                  ) {
                    return `this.tsdi.configure(${component.type.name.getText()}, {
                      initializer: '${component.initializer}' || undefined,
                      meta: ${meta},
                      ${provider}
                    });`;
                  }
                  return `this.tsdi.configure(${component.type.name.getText()}, {
                    ${provider}
                    constructorDependencies: [${component.constructorDependencies
                      .map(dependency => dependency.name!.getText())
                      .join(', ')}],
                    propertyDependencies: [${component.propertyDependencies
                      .map(
                        dependency =>
                          `{property: "${
                            dependency.property
                          }", type: ${dependency.type.name!.getText()}}`
                      )
                      .join(', ')}],
                      meta: ${meta},
                      initializer: '${component.initializer}' || undefined
                });`;
                })
                .join('\n')}
            }

            ${getter
              .map(([name, type]) => {
                return `
                  public get ${name}(): ${type} {
                    return this.tsdi.get(${type});
                  }
                `;
              })
              .join('\n')}
          }
        `,
          {
            ...(await prettier.resolveConfig(base.getSourceFile().fileName)),
            ...{ parser: 'typescript' }
          }
        );
      }
    };
  }
}
