import {
  ClassDeclaration,
  MethodDeclaration,
  SyntaxKind,
  TypeGuards
} from 'ts-morph';
import { meta, provides } from '../tsdi';
import { Component } from './component';
import { Container } from './container';
import { findDeclarationForIdentifier } from './util';

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
    // todo: check if its the correct provides decorator
    const providerMethods = this.node
      .getInstanceMethods()
      .filter(method => Boolean(method.getDecorator(provides.name)));
    return providerMethods.map(method => {
      const singleton = this.isSingleton(method);
      const scope = this.getScope(method);
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
          .map(node => new Component(this.container, node));

        return {
          meta,
          component: new Component(this.container, node),
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
    return new Component(this.container, this.node);
  }

  public importName: string;

  /**
   * @internal
   */
  constructor(
    private readonly container: Container<any>,
    public node: ClassDeclaration
  ) {
    this.importName = `${
      this.container.compiler.idGen
    }_${this.node.getNameOrThrow()}`;
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

  // tslint:disable-next-line:cyclomatic-complexity
  private isSingleton(method: MethodDeclaration): boolean | undefined {
    // todo: check if its the correct meta decorator
    const metaDecorator = method.getDecorator(meta.name);
    if (!metaDecorator) {
      return undefined;
    }
    const metaArguments = metaDecorator.getArguments();
    const metaConfig = metaArguments[0];
    if (!TypeGuards.isObjectLiteralExpression(metaConfig)) {
      throw new Error('Invalid meta configuration: ' + metaDecorator.print());
    }
    const property = metaConfig.getProperty('singleton');
    if (!property || !TypeGuards.isPropertyAssignment(property)) {
      return undefined;
    }
    const value = property.getInitializer();
    if (!value || !TypeGuards.isBooleanLiteral(value)) {
      return undefined;
    }
    return value.getKind() === SyntaxKind.TrueKeyword;
  }

  // tslint:disable-next-line:cyclomatic-complexity
  private getScope(method: MethodDeclaration): string | undefined {
    // todo: check if its the correct meta decorator
    const metaDecorator = method.getDecorator(meta.name);
    if (!metaDecorator) {
      return undefined;
    }
    const metaArguments = metaDecorator.getArguments();
    const metaConfig = metaArguments[0];
    if (!TypeGuards.isObjectLiteralExpression(metaConfig)) {
      throw new Error('Invalid meta configuration: ' + metaDecorator.print());
    }
    const property = metaConfig.getProperty('scope');
    if (!property || !TypeGuards.isPropertyAssignment(property)) {
      return undefined;
    }
    const value = property.getInitializer();
    if (!value || !TypeGuards.isStringLiteral(value)) {
      return undefined;
    }
    return value.getText();
  }
}
