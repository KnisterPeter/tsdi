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

  public get singleton(): boolean | undefined {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return undefined;
    }
    return getBooleanDecoratorProperty(
      this.container.compiler,
      this.node,
      'meta',
      'singleton'
    );
  }

  public get scope(): string | undefined {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return undefined;
    }
    return getStringDecoratorProperty(
      this.container.compiler,
      this.node,
      'meta',
      'scope'
    );
  }

  public get eager(): boolean | undefined {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return undefined;
    }
    return getBooleanDecoratorProperty(
      this.container.compiler,
      this.node,
      'meta',
      'eager'
    );
  }

  public get constructorDependencies(): { name: string; type: Component }[] {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return [];
    }
    if (!this.container.compiler.getDecorator(this.node, 'managed')) {
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
    const managedProperties = this.node
      .getProperties()
      .filter(property =>
        this.container.compiler.getDecorator(property, 'managed')
      );
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
          const lazy = getBooleanDecoratorProperty(
            this.container.compiler,
            property,
            'managed',
            'lazy'
          );
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

  public get afterConstruct(): string | undefined {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return undefined;
    }
    const method = this.node
      .getMethods()
      .find(method =>
        Boolean(this.container.compiler.getDecorator(method, 'afterConstruct'))
      );
    if (!method) {
      return undefined;
    }
    return method.getName();
  }

  public get beforeDestroy(): string | undefined {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return undefined;
    }
    const method = this.node
      .getMethods()
      .find(method =>
        Boolean(this.container.compiler.getDecorator(method, 'beforeDestroy'))
      );
    if (!method) {
      return undefined;
    }
    return method.getName();
  }

  public get by(): Container<any> | undefined {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return undefined;
    }
    const value = getDecoratorPropertyInitializer(
      this.container.compiler,
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
      initializer: this.afterConstruct,
      disposer: this.beforeDestroy
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
    const registry = this.container.compiler.componentRegistry;
    const existing = registry
      .filter(entry => entry.container === container)
      .find(entry => entry.component.node === node);
    if (existing) {
      return existing.component;
    }
    // /-- singleton check

    if (this.convertToLegacyComponent()) {
      const legacy = new LegacyComponent(container, node);
      registry.push({ container, component: legacy });
      return legacy;
    }
    this.validate();
    registry.push({ container, component: this });
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
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return false;
    }
    return Boolean(
      this.container.compiler.getDecorator(this.node, 'Component') ||
        this.container.compiler.getDecorator(this.node, 'External')
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
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return true;
    }
    const managed = this.container.compiler.getDecorator(this.node, 'managed');
    const unit = this.container.compiler.getDecorator(this.node, 'unit');
    return Boolean(managed || unit);
  }
}

class LegacyComponent extends Component {
  public get singleton(): boolean | undefined {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return undefined;
    }
    return getBooleanDecoratorProperty(
      this.container.compiler,
      this.node,
      'Component',
      'singleton'
    );
  }

  public get scope(): string | undefined {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return undefined;
    }
    return getStringDecoratorProperty(
      this.container.compiler,
      this.node,
      'Component',
      'scope'
    );
  }

  public get constructorDependencies(): { name: string; type: Component }[] {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return [];
    }
    if (this.node.getConstructors().length === 0) {
      return [];
    }

    const parameters = this.node.getConstructors()[0].getParameters();

    // todo: handle legacy constructor parameters correctly
    // this means in legacy it was possible to have parameters
    // which are not injected
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
        `Invalid node on [${
          this.name
        }] for constructor parameter '${parameter.print()}' (${parameter
          .getSourceFile()
          .getFilePath()}:${parameter.getStartLineNumber(false)})
${node.print({ removeComments: true })}`
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
    const managedProperties = this.node
      .getProperties()
      .filter(property =>
        this.container.compiler.getDecorator(property, 'Inject')
      );

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
              return getBooleanDecoratorProperty(
                this.container.compiler,
                property,
                'Inject',
                'lazy'
              );
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

  public get afterConstruct(): string | undefined {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return undefined;
    }
    const method = this.node
      .getMethods()
      .find(method =>
        Boolean(this.container.compiler.getDecorator(method, 'Initialize'))
      );
    if (!method) {
      return undefined;
    }
    return method.getName();
  }

  public get beforeDestroy(): string | undefined {
    if (TypeGuards.isInterfaceDeclaration(this.node)) {
      return undefined;
    }
    const method = this.node
      .getMethods()
      .find(method =>
        Boolean(this.container.compiler.getDecorator(method, 'Destroy'))
      );
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
