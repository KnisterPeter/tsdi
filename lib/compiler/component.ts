import {
  ClassDeclaration,
  InterfaceDeclaration,
  SyntaxKind,
  TypeGuards
} from 'ts-morph';
import { Container } from './container';
import { Unit } from './unit';
import {
  findDeclarationForIdentifier,
  getBooleanDecoratorProperty,
  getDecoratorPropertyInitializer,
  getStringDecoratorProperty
} from './util';

export class Component {
  private static SymbolId = 0;

  private static readonly registry: {
    container: Container<any>;
    component: Component;
  }[] = [];

  public get name(): string {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return this.node.getName();
    }
    return this.node.getNameOrThrow();
  }

  private readonly symbolId = Component.SymbolId++;

  public get symbol(): [string, string] {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return [
        `Symbol.for('${this.node.getName()}-${this.symbolId}')`,
        this.importName
      ];
    }
    return [this.importName, this.importName];
  }

  // tslint:disable-next-line:cyclomatic-complexity
  public get singleton(): boolean | undefined {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return undefined;
    }
    return getBooleanDecoratorProperty(this.node, 'meta', 'singleton');
  }

  // tslint:disable-next-line:cyclomatic-complexity
  public get scope(): string | undefined {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return undefined;
    }
    return getStringDecoratorProperty(this.node, 'meta', 'scope');
  }

  // tslint:disable-next-line:cyclomatic-complexity
  public get eager(): boolean | undefined {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return undefined;
    }
    return getBooleanDecoratorProperty(this.node, 'meta', 'eager');
  }

  public get constructorDependencies(): { name: string; type: Component }[] {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return [];
    }
    // todo: check if its the correct managed decorator
    if (!this.node.getDecorator('managed')) {
      return [];
    }
    if (this.node.getConstructors().length === 0) {
      return [];
    }

    const parameters = this.node.getConstructors()[0].getParameters();

    return parameters.map(parameter => {
      const identifier = parameter
        .getTypeNodeOrThrow()
        .getFirstChildByKindOrThrow(SyntaxKind.Identifier);
      const node = findDeclarationForIdentifier(identifier);
      if (
        TypeGuards.isClassDeclaration(node) ||
        TypeGuards.isInterfaceDeclaration(node)
      ) {
        return {
          name: parameter.getNameOrThrow(),
          type: new Component(this.container, node)
        };
      }
      throw new Error(
        'Only interfaces or classes are valid types for constructor injection. ' +
          `But for [${parameter.getName()}] got '${node.print()}' instead`
      );
    });
  }

  public get propertyDependencies(): {
    name: string;
    type: Component;
    meta?: { lazy?: boolean };
  }[] {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return [];
    }
    // todo: check if its the correct managed decorator
    const managedProperties = this.node
      .getProperties()
      .filter(property => property.getDecorator('managed'));
    return managedProperties.map(property => {
      const identifier = property
        .getTypeNodeOrThrow()
        .getFirstChildByKindOrThrow(SyntaxKind.Identifier);
      const node = findDeclarationForIdentifier(identifier);
      if (
        TypeGuards.isClassDeclaration(node) ||
        TypeGuards.isInterfaceDeclaration(node)
      ) {
        const meta = (() => {
          const lazy = getBooleanDecoratorProperty(property, 'managed', 'lazy');
          if (lazy !== undefined) {
            return {
              lazy
            };
          }
          return undefined;
        })();

        return {
          name: property.getName(),
          type: new Component(this.container, node),
          meta
        };
      }
      throw new Error(
        'Only interfaces or classes are valid types for property injection. ' +
          `But for [${property.getName()}] got '${node.print()}' instead`
      );
    });
  }

  public get postConstruct(): string | undefined {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return undefined;
    }
    // todo: check if its the correct postConstruct decorator
    const method = this.node
      .getMethods()
      .find(method => Boolean(method.getDecorator('postConstruct')));
    if (!method) {
      return undefined;
    }
    return method.getName();
  }

  public get preDestroy(): string | undefined {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return undefined;
    }
    // todo: check if its the correct preDestroy decorator
    const method = this.node
      .getMethods()
      .find(method => Boolean(method.getDecorator('preDestroy')));
    if (!method) {
      return undefined;
    }
    return method.getName();
  }

  // tslint:disable-next-line:cyclomatic-complexity
  public get by(): Container<any> | undefined {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return undefined;
    }
    const value = getDecoratorPropertyInitializer(
      this.node,
      'managed',
      'by',
      SyntaxKind.Identifier
    );
    if (!value) {
      return undefined;
    }
    const node = findDeclarationForIdentifier(value);
    if (!TypeGuards.isClassDeclaration(node)) {
      throw new Error('Illegal node type for container: ' + node.print());
    }
    return this.container.compiler
      .getContainers()
      .find(container => container.clazz === node);
  }

  protected get providerConfiguration():
    | ReturnType<Unit['getProviderConfiguration']>
    | undefined {
    const provider = this.container.units.find(unit =>
      Boolean(unit.provides.find(component => component === this))
    );
    if (provider) {
      return provider.getProviderConfiguration(this);
    }
    return undefined;
  }

  public get configuration(): {
    provider?: ReturnType<Unit['getProviderConfiguration']>;
    constructorDependencies?: [string, string][];
    propertyDependencies: {
      property: string;
      type: [string, string];
      meta?: {
        lazy?: boolean;
      };
    }[];
    meta?: {
      singleton?: boolean;
      scope?: string;
      eager?: boolean;
    };
    initializer?: string;
    disposer?: string;
  } {
    const meta = (() => {
      if (
        this.singleton !== undefined ||
        this.scope !== undefined ||
        this.eager !== undefined
      ) {
        return {
          singleton: this.singleton,
          scope: this.scope,
          eager: this.eager
        };
      }
      return undefined;
    })();

    const providerConfiguration = this.providerConfiguration;
    return {
      provider: providerConfiguration,
      constructorDependencies:
        this.constructorDependencies.length > 0
          ? this.constructorDependencies.map(
              dependency => dependency.type.symbol
            )
          : undefined,
      propertyDependencies: this.propertyDependencies.map(dependency => ({
        property: dependency.name,
        type: dependency.type.symbol,
        meta: dependency.meta
      })),
      meta: providerConfiguration ? providerConfiguration.meta : meta,
      initializer: this.postConstruct,
      disposer: this.preDestroy
    };
  }

  public importName: string;

  /**
   * @internal
   */
  constructor(
    protected container: Container<any>,
    public node: InterfaceDeclaration | ClassDeclaration
  ) {
    if (this.name !== 'TSDI') {
      this.importName = `${
        this.container.compiler.idGen
      }_${this.node.getName()}`;
    } else {
      this.importName = 'TSDI';
    }

    // -- singleton check
    const existing = Component.registry
      .filter(entry => entry.container === container)
      .find(entry => entry.component.node === node);
    if (existing) {
      return existing.component;
    }
    // /-- singleton check

    if (this.convertToLegacyComponent()) {
      const legacy = new LegacyComponent(container, node);
      Component.registry.push({ container, component: legacy });
      return legacy;
    }
    this.validate();
    Component.registry.push({ container, component: this });
  }

  protected validate(): void {
    if (!this.isManaged()) {
      // todo: check TSDI ast node instead of name
      if (this.name !== 'TSDI') {
        throw new Error(
          `Managed dependency [${this.name}] is missing @managed decorator`
        );
      }
    }
  }

  private isComponentOrExternalClass(): boolean {
    // todo: check if its the correct component or external decorator
    return Boolean(
      TypeGuards.isClassDeclaration(this.node) &&
        (this.node.getDecorator('component') ||
          this.node.getDecorator('external'))
    );
  }

  private convertToLegacyComponent(): boolean {
    if (this instanceof LegacyComponent) {
      return false;
    }
    if (this.isComponentOrExternalClass()) {
      return true;
    }
    // is this component provided by a factory?
    return (
      this.container.compiler
        .getLegacyFactoryNodes()
        .find(({ node }) => node === this.node) !== undefined
    );
  }

  private isManaged(): boolean {
    // todo: check if its the correct managed, component and unit decorator
    return Boolean(
      TypeGuards.isInterfaceDeclaration(this.node) ||
        (this.node.getDecorator('managed') || this.node.getDecorator('unit'))
    );
  }
}

class LegacyComponent extends Component {
  // tslint:disable-next-line:cyclomatic-complexity
  public get singleton(): boolean | undefined {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return undefined;
    }
    return getBooleanDecoratorProperty(this.node, 'component', 'singleton');
  }

  // tslint:disable-next-line:cyclomatic-complexity
  public get scope(): string | undefined {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return undefined;
    }
    return getStringDecoratorProperty(this.node, 'component', 'scope');
  }

  public get constructorDependencies(): { name: string; type: Component }[] {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return [];
    }
    if (this.node.getConstructors().length === 0) {
      return [];
    }

    const parameters = this.node.getConstructors()[0].getParameters();

    return parameters.map(parameter => {
      const identifier = parameter
        .getTypeNodeOrThrow()
        .getFirstChildByKindOrThrow(SyntaxKind.Identifier);
      const node = findDeclarationForIdentifier(identifier);
      if (
        TypeGuards.isClassDeclaration(node) ||
        TypeGuards.isInterfaceDeclaration(node)
      ) {
        return {
          name: parameter.getNameOrThrow(),
          type: new Component(this.container, node)
        };
      }
      throw new Error('Illegal node type for component: ' + node.print());
    });
  }

  public get propertyDependencies(): {
    name: string;
    type: Component;
    meta?: { lazy?: boolean };
  }[] {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return [];
    }
    // todo: check if its the correct inject decorator
    const managedProperties = this.node
      .getProperties()
      .filter(property => property.getDecorator('inject'));
    return managedProperties.map(property => {
      const identifier = property
        .getTypeNodeOrThrow()
        .getFirstChildByKindOrThrow(SyntaxKind.Identifier);
      const node = findDeclarationForIdentifier(identifier);
      if (
        TypeGuards.isClassDeclaration(node) ||
        TypeGuards.isInterfaceDeclaration(node)
      ) {
        const meta = (() => {
          const lazy = (() => {
            try {
              return getBooleanDecoratorProperty(property, 'inject', 'lazy');
            } catch (e) {
              return undefined;
            }
          })();
          if (lazy !== undefined) {
            return {
              lazy
            };
          }
          return undefined;
        })();

        return {
          name: property.getName(),
          type: new Component(this.container, node),
          meta
        };
      }
      throw new Error('Illegal node type for component: ' + node.print());
    });
  }

  public get postConstruct(): string | undefined {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return undefined;
    }
    // todo: check if its the correct initialize decorator
    const method = this.node
      .getMethods()
      .find(method => Boolean(method.getDecorator('initialize')));
    if (!method) {
      return undefined;
    }
    return method.getName();
  }

  public get preDestroy(): string | undefined {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return undefined;
    }
    // todo: check if its the correct destroy decorator
    const method = this.node
      .getMethods()
      .find(method => Boolean(method.getDecorator('destroy')));
    if (!method) {
      return undefined;
    }
    return method.getName();
  }

  protected get providerConfiguration():
    | ReturnType<Unit['getProviderConfiguration']>
    | undefined {
    const providerInfo = this.container.compiler
      .getLegacyFactories(this.container)
      .find(({ component }) => this === component);
    if (
      !providerInfo ||
      TypeGuards.isInterfaceDeclaration(providerInfo.factory.node)
    ) {
      return undefined;
    }
    return {
      unit: {
        node: providerInfo.factory.node,
        importName: providerInfo.factory.importName,
        provides: [],
        getProviderConfiguration(): any {
          return undefined as any;
        }
      },
      class: providerInfo.factory.name,
      method: providerInfo.method.getName(),
      dependencies: []
    };
  }

  constructor(
    container: Container<any>,
    node: InterfaceDeclaration | ClassDeclaration
  ) {
    super(container, node);
  }

  protected validate(): void {
    // nothing to do
  }
}
