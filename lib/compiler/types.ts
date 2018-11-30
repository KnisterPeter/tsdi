import ts from 'typescript';
import { DefinitionNotFoundError } from './errors';
import { Navigation } from './navigation';
import {
  checkManagedDecorator,
  filter,
  findClosestClass,
  findDependencies,
  getConstructor,
  getDecorator,
  getDecoratorParameters,
  getMethodReturnType,
  getValueFromObjectLiteral,
  hasDecorator,
  isAbstract,
  isSingleton
} from './utils';

/**
 * @internal
 */
export class Component {
  private static readonly cache: { [key: string]: Component } = {};

  public provider?: {
    class: ts.ClassDeclaration;
    method: string;
    parameters: ts.ClassDeclaration[];
  };

  public get constructorDependencies(): ts.ClassDeclaration[] {
    const constructor = getConstructor(this.type);
    if (constructor) {
      return constructor.parameters
        .filter(
          parameter =>
            parameter.type && parameter.type.kind !== ts.SyntaxKind.AnyKeyword
        )
        .map(parameter => {
          return findClosestClass(this.navigation.findDefinition(parameter));
        });
    }
    return [];
  }

  public get propertyDependencies(): {
    property: string;
    type: ts.ClassDeclaration;
  }[] {
    return this.type.members
      .filter(
        (member): member is ts.PropertyDeclaration =>
          ts.isPropertyDeclaration(member)
      )
      .filter(member => hasDecorator('managed', member))
      .map(member => {
        const definition = findClosestClass(
          this.navigation.findDefinition(member)
        );

        const propertyName = member.name.getText();
        return {
          property: propertyName,
          type: definition
        };
      });
  }

  private _singleton: boolean | undefined;

  public get meta(): {
    singleton?: boolean;
    scope?: string;
  } {
    let singleton =
      typeof this._singleton !== 'undefined' ? this._singleton : undefined;
    let scope: string | undefined;

    const meta = getDecorator('meta', this.type);
    if (meta) {
      const parameters = getDecoratorParameters(meta);
      // per type signature first parameter of meta is always object literal expression
      const config = parameters[0] as ts.ObjectLiteralExpression;

      singleton = isSingleton(config);

      const scopeNode = getValueFromObjectLiteral(config, 'scope');
      if (scopeNode) {
        if (ts.isStringLiteral(scopeNode)) {
          scope = scopeNode.text;
        }
      }
    }

    return {
      singleton,
      scope
    };
  }

  public get initializer(): string | undefined {
    const initializer = this.type.members.find(
      member =>
        ts.isMethodDeclaration(member) && hasDecorator('initialize', member)
    );
    if (initializer) {
      return initializer.name!.getText();
    }
    return undefined;
  }

  public get disposer(): string | undefined {
    const initializer = this.type.members.find(
      member =>
        ts.isMethodDeclaration(member) && hasDecorator('destroy', member)
    );
    if (initializer) {
      return initializer.name!.getText();
    }
    return undefined;
  }

  public get components(): Component[] {
    const all = new Set([
      ...this.constructorDependencies.map(
        dep => new Component(dep, this.navigation)
      ),
      ...this.propertyDependencies.map(
        dep => new Component(dep.type, this.navigation)
      )
    ]);

    return Array.from(all);
  }

  constructor(
    public readonly type: ts.ClassDeclaration,
    protected readonly navigation: Navigation
  ) {
    const key = `${type.getSourceFile()}:${type.getStart()}`;
    if (Component.cache[key]) {
      return Component.cache[key];
    }
    if (
      hasDecorator('component', type) &&
      !(this instanceof ClassicComponent)
    ) {
      return new ClassicComponent(type, navigation);
    }
    Component.cache[key] = this;
  }

  public setSingleton(singleton: boolean): void {
    this._singleton = singleton;
  }

  public validate(): void {
    checkManagedDecorator(this.type, this);
  }
}

export class ClassicComponent extends Component {
  public get propertyDependencies(): {
    property: string;
    type: ts.ClassDeclaration;
  }[] {
    return this.type.members
      .filter(
        (member): member is ts.PropertyDeclaration =>
          ts.isPropertyDeclaration(member)
      )
      .filter(member => hasDecorator('inject', member))
      .map(member => {
        const definition = findClosestClass(
          this.navigation.findDefinition(member)
        );

        const propertyName = member.name.getText();
        return {
          property: propertyName,
          type: definition
        };
      });
  }

  constructor(type: ts.ClassDeclaration, navigation: Navigation) {
    super(type, navigation);
  }

  public validate(): void {
    //
  }
}

/**
 * @internal
 */
export class Container {
  private readonly externalComponents: Component[] = [];

  public get entryPoints(): ts.NodeArray<ts.ClassElement> {
    return filter(this.node.members, isAbstract);
  }

  private _units: Unit[] | undefined;

  public get units(): Unit[] {
    if (this._units) {
      return this._units;
    }

    if (!this.node.decorators) {
      return [];
    }

    const parameters = getDecoratorParameters(this.node.decorators[0]);
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

    try {
      this._units = unitIdentifiers.map(unitIdentifier => {
        return new Unit(
          findClosestClass(this.navigation.findDefinition(unitIdentifier)),
          this.navigation
        );
      });
      return this._units;
    } catch (e) {
      if (e instanceof DefinitionNotFoundError) {
        throw new Error('Declared unit not found');
      }
      throw e;
    }
  }

  public get components(): Component[] {
    const dependencies = findDependencies(
      this.entryPoints,
      this.navigation
    ).map(dep => new Component(dep, this.navigation));

    const provided = this.units.reduce(
      (list, unit) => [...list, unit.component, ...unit.provides],
      [] as Component[]
    );

    const all = new Set([...dependencies, ...provided]);

    return Array.from(all);
  }

  public get managed(): Component[] {
    const all = new Set([
      ...this.components,
      ...this.components.reduce(
        (list, component) => [...list, ...component.components],
        [] as Component[]
      ),
      ...this.units.reduce(
        (list, unit) => [...list, ...unit.injects],
        [] as Component[]
      ),
      ...this.externalComponents
    ]);

    return Array.from(all);
  }

  constructor(
    public node: ts.ClassDeclaration,
    private readonly navigation: Navigation
  ) {}

  public addManagedDependency(component: Component): void {
    this.externalComponents.push(component);
  }

  public validate(): void {
    this.components.forEach(component => {
      component.validate();
    });
  }
}

/**
 * @internal
 */
export class Unit {
  private _provides: Component[] | undefined;

  public get component(): Component {
    return new Component(this.node, this.navigation);
  }

  public get injects(): Component[] {
    return this.node.members
      .filter(
        (member): member is ts.MethodDeclaration =>
          ts.isMethodDeclaration(member)
      )
      .filter(member => hasDecorator('provides', member))
      .reduce(
        (injects, member) => {
          const classes = member.parameters
            .map(parameter => {
              return findClosestClass(
                this.navigation.findDefinition(parameter)
              );
            })
            .map(clazz => new Component(clazz, this.navigation));
          return [...injects, ...classes];
        },
        [] as Component[]
      );
  }

  public get provides(): Component[] {
    if (this._provides) {
      return this._provides;
    }

    this._provides = this.node.members
      .filter(
        (member): member is ts.MethodDeclaration =>
          ts.isMethodDeclaration(member)
      )
      .filter(member => hasDecorator('provides', member))
      .map(member => {
        // -- is singleton?
        const singleton = (() => {
          const provides = getDecorator('provides', member)!;
          const parameters = getDecoratorParameters(provides);
          if (parameters.length > 0) {
            // per type signature first parameter of provides is always
            // object literal expression
            const config = parameters[0] as ts.ObjectLiteralExpression;
            return isSingleton(config);
          }
          return true;
        })();
        // /- is singleton?

        const parameterTypes = member.parameters.map(parameter => {
          return findClosestClass(this.navigation.findDefinition(parameter));
        });

        const returnType = getMethodReturnType(member, this.navigation);

        const component = new Component(returnType, this.navigation);
        component.setSingleton(singleton);
        component.provider = {
          class: this.node,
          method: member.name.getText(),
          parameters: parameterTypes
        };
        return component;
      });
    return this._provides;
  }

  constructor(
    public node: ts.ClassDeclaration,
    private readonly navigation: Navigation
  ) {}
}
