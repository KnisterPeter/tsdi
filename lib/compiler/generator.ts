import { basename, dirname, relative, sep } from 'path';
import * as prettier from 'prettier';
import * as ts from 'typescript';
import { Component } from './types';

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

    const getComponentConfiguration = (component: Component): string => {
      let code = '';

      const shouldEmit = (expr: any) =>
        Boolean(typeof expr === 'function' ? expr() : expr);

      const emitString = (input: any) => {
        code += "'";
        code += input;
        code += "'";
      };

      const emitObjectIf = (expr: any, fn: () => void) => {
        if (shouldEmit(expr)) {
          code += '{';
          fn();
          code += '}';
        }
      };

      const emitPropertyIf = (expr: any, name: string, fn: () => void) => {
        if (shouldEmit(expr)) {
          code += name;
          code += ':';
          fn();
          code += ',';
        }
      };

      const emitArrayIf = <T>(expr: any, items: T[], fn: (item: T) => void) => {
        if (shouldEmit(expr)) {
          code += '[';
          items.forEach(item => {
            fn(item);
            code += ',';
          });
          code += ']';
        }
      };

      const hasProvider = () => component.provider;
      const hasConstructorDependencies = () =>
        component.constructorDependencies.length > 0;
      const hasPropertyDependencies = () =>
        component.propertyDependencies.length > 0;
      const hasSingleton = () => typeof component.meta.singleton === 'boolean';
      const hasScope = () => typeof component.meta.scope !== 'undefined';
      const hasMeta = () => hasSingleton();
      const hasInitializer = () => component.initializer;
      const hasDisposer = () => component.disposer;

      emitObjectIf(true, () => {
        emitPropertyIf(hasProvider, 'provider', () => {
          emitObjectIf(true, () => {
            emitPropertyIf(true, 'class', () => {
              code += component.provider!.class.name!.getText();
            });
            emitPropertyIf(true, 'method', () => {
              emitString(component.provider!.method);
            });
            emitPropertyIf(true, 'dependencies', () => {
              emitArrayIf(true, component.provider!.parameters, parameter => {
                code += parameter.name!.getText();
              });
            });
          });
        });
        emitPropertyIf(
          hasConstructorDependencies,
          'constructorDependencies',
          () => {
            emitArrayIf(true, component.constructorDependencies, dependency => {
              code += dependency.name!.getText();
            });
          }
        );
        emitPropertyIf(hasPropertyDependencies, 'propertyDependencies', () => {
          emitArrayIf(true, component.propertyDependencies, dependency => {
            emitObjectIf(true, () => {
              emitPropertyIf(true, 'property', () => {
                emitString(dependency.property);
              });
              emitPropertyIf(true, 'type', () => {
                code += dependency.type.name!.getText();
              });
            });
          });
        });
        emitPropertyIf(hasMeta, 'meta', () => {
          emitObjectIf(true, () => {
            emitPropertyIf(hasSingleton, 'singleton', () => {
              code += Boolean(component.meta.singleton);
            });
            emitPropertyIf(hasScope, 'scope', () => {
              emitString(component.meta.scope);
            });
          });
        });
        emitPropertyIf(hasInitializer, 'initializer', () => {
          emitString(component.initializer);
        });
        emitPropertyIf(hasDisposer, 'disposer', () => {
          emitString(component.disposer);
        });
      });

      return code;
    };

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
              this.tsdi = new TSDI(${baseName});
              ${components
                .map(component => {
                  if (!component.type.name) {
                    throw new Error(
                      `Anonymous classes as components are not supported`
                    );
                  }

                  const config = getComponentConfiguration(component);
                  return `this.tsdi.configure(${component.type.name.getText()}, ${config});`;
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
