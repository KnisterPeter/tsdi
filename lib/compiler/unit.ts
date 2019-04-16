import { ClassDeclaration, SyntaxKind, TypeGuards } from 'ts-morph';
import { Compiler } from '.';
import { Component } from './component';
import { Container } from './container';
import {
  findDeclarationForIdentifier,
  getBooleanDecoratorProperty,
  getStringDecoratorProperty
} from './util';

export interface Unit {
  node: ClassDeclaration;
  importName: string;
  provides: Component[];
  getProviderConfiguration(
    component: Component
  ): {
    unit: Unit;
    meta?: { singleton?: boolean };
    class: string;
    method: string;
    dependencies: [string, string][];
  };
}

export class UnitImpl implements Unit {
  public get name(): string {
    return this.node.getNameOrThrow();
  }

  private get providesInfo(): {
    meta?: { singleton?: boolean };
    component: Component;
    method: string;
    dependencies: Component[];
  }[] {
    const providerMethods = this.node
      .getInstanceMethods()
      .filter(method =>
        Boolean(this.container.compiler.getDecorator(method, 'provides'))
      );
    return providerMethods.map(method => {
      const singleton = getBooleanDecoratorProperty(
        this.container.compiler,
        method,
        'meta',
        'singleton'
      );
      const scope = getStringDecoratorProperty(
        this.container.compiler,
        method,
        'meta',
        'scope'
      );
      const meta = (() => {
        if (singleton !== undefined || scope !== undefined) {
          return {
            singleton,
            scope
          };
        }
        return undefined;
      })();

      const identifier = method
        .getReturnTypeNodeOrThrow()
        .getFirstChildByKindOrThrow(SyntaxKind.Identifier);
      const node = findDeclarationForIdentifier(identifier);
      if (
        TypeGuards.isClassDeclaration(node) ||
        TypeGuards.isInterfaceDeclaration(node)
      ) {
        const dependencies = method
          .getParameters()
          .map(parameter =>
            parameter
              .getTypeNodeOrThrow()
              .getFirstChildByKindOrThrow(SyntaxKind.Identifier)
          )
          .map(identifier => findDeclarationForIdentifier(identifier))
          .map(node => {
            if (
              !TypeGuards.isClassDeclaration(node) &&
              !TypeGuards.isInterfaceDeclaration(node)
            ) {
              throw new Error(
                'Illegal node type for component: ' + node.print()
              );
            }
            return node;
          })
          .map(node => new Component(this.compiler, this.container, node));

        return {
          meta,
          component: new Component(this.compiler, this.container, node),
          method: method.getName(),
          dependencies
        };
      }
      throw new Error('Illegal node type for component: ' + node.print());
    });
  }

  public get provides(): Component[] {
    return this.providesInfo.map(info => info.component);
  }

  public get unitComponent(): Component {
    return new Component(this.compiler, this.container, this.node);
  }

  public importName: string;

  /**
   * @internal
   */
  constructor(
    private readonly compiler: Compiler,
    private readonly container: Container<any>,
    public node: ClassDeclaration
  ) {
    this.compiler.logger.info(`Creating unit [${this.name}]`);
    this.importName = this.unitComponent.importName;
  }

  public getProviderConfiguration(
    component: Component
  ): ReturnType<Unit['getProviderConfiguration']> {
    const info = this.providesInfo.find(info => info.component === component);
    if (!info) {
      throw new Error('No unit configuration for component: ' + component);
    }
    return {
      unit: this,
      meta: info.meta,
      class: this.name,
      method: info.method,
      dependencies: info.dependencies.map(dependency => dependency.symbol)
    };
  }
}
