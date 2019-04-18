import { ClassDeclaration, SyntaxKind, TypeGuards } from 'ts-morph';
import { Compiler } from '.';
import { container } from '../tsdi';
import { Component } from './component';
import { UnitImpl } from './unit';
import { findDeclarationForIdentifier, isEqualNodes } from './util';

export class Container<T> {
  public get name(): string {
    return this.node.getNameOrThrow();
  }

  public get implName(): string {
    return `${this.name}Impl`;
  }

  public get entryPoints(): { name: string; type: Component }[] {
    const properties = this.node
      .getProperties()
      .filter(property => property.isAbstract());

    return properties.map(property => {
      const identifier = property
        .getTypeNodeOrThrow()
        .getFirstChildByKindOrThrow(SyntaxKind.Identifier);

      const node = findDeclarationForIdentifier(identifier);
      if (
        TypeGuards.isClassDeclaration(node) ||
        TypeGuards.isInterfaceDeclaration(node)
      ) {
        return {
          name: property.getName(),
          type: new Component(this.compiler, this, node)
        };
      }
      throw new Error('Illegal node type for component: ' + node.print());
    });
  }

  private _units?: UnitImpl[];

  // tslint:disable-next-line:cyclomatic-complexity
  public get units(): UnitImpl[] {
    if (this._units) {
      return this._units;
    }
    const containerDecorator = this.node.getDecorator(container.name);
    if (containerDecorator && containerDecorator.isDecoratorFactory()) {
      const options = containerDecorator.getArguments()[0];
      if (!TypeGuards.isObjectLiteralExpression(options)) {
        throw new Error('Invalid container decorator: ' + this.node.print());
      }
      const unitsProperty = options.getProperty('units');
      if (!unitsProperty || !TypeGuards.isPropertyAssignment(unitsProperty)) {
        throw new Error('Invalid container units: ' + this.node.print());
      }
      const unitsArray = unitsProperty.getInitializerIfKindOrThrow(
        SyntaxKind.ArrayLiteralExpression
      );
      this._units = unitsArray.getElements().map(element => {
        if (!TypeGuards.isIdentifier(element)) {
          throw new Error(
            'Invalid container unit must be identifier: ' + element.print()
          );
        }
        const node = findDeclarationForIdentifier(element);
        if (TypeGuards.isClassDeclaration(node)) {
          return new UnitImpl(this.compiler, this, node);
        } else {
          throw new Error('Illegal node type for unit: ' + node.print());
        }
      });
    } else {
      this._units = [];
    }
    return this._units;
  }

  private get internals(): Component[] {
    const pending = [
      ...this.entryPoints.map(entryPoint => entryPoint.type),
      ...this.units.map(unit => unit.unitComponent)
    ];
    const list = new Set<Component>();

    while (pending.length > 0) {
      const component = pending.shift();
      if (component) {
        list.add(component);
        pending.push(
          ...component.constructorDependencies
            .map(dependency => dependency.type)
            .filter(component => !list.has(component)),
          ...component.propertyDependencies
            .map(dependency => dependency.type)
            .filter(component => !list.has(component))
        );
      }
    }
    return Array.from(list);
  }

  public get externals(): Component[] {
    const filterInternals = (list: Component[]) =>
      list.filter(component => !this.internals.includes(component));

    const all = [
      ...this.compiler.getComponents(this),
      ...this.compiler.getLegacyComponents(this),
      ...this.compiler.getLegacyFactories(this).map(info => info.component),
      ...this.compiler.getLegacyExternals(this)
    ];
    if (this.compiler.getContainers().length > 1) {
      const unassigned = filterInternals(
        all.filter(component => !component.by)
      );
      if (unassigned.length > 0) {
        throw new Error(
          `Unassigned externals [${
            unassigned[0].name
          }] is not supported if using multiple containers`
        );
      }

      return filterInternals(
        all
          .filter(component => component.by)
          .filter(component => component.by!.node === this.node)
      );
    }
    return filterInternals(all);
  }

  public get components(): Component[] {
    return [...this.internals, ...this.externals];
  }

  /**
   * @internal
   */
  public get code(): string {
    return this.generate(__dirname);
  }

  public importName: string;

  /**
   * @internal
   */
  constructor(public compiler: Compiler, public node: ClassDeclaration) {
    this.importName = `${this.compiler.idGen}_Container`;

    const existing = this.compiler.singletonInstances.find(entry =>
      isEqualNodes(entry.node, this.node)
    );
    if (existing) {
      return existing as any;
    }

    this.compiler.logger.info(`Creating container [${this.name}]`);
    this.compiler.singletonInstances.push(this);
  }

  public generate(targetDirectoryPath: string): string {
    return this.compiler.generator.createContainer(this, targetDirectoryPath);
  }

  // note: this any could be replaced if there would be an interface
  // of the TSDI api. But since this is generated by tsc this is not
  // available at compile time upfront. The type here need to be the
  // public TSDI api.
  public instantiate(impl?: any): T {
    // console.log(this.code);
    return this.compiler.runtime.createContainer(this, impl);
  }
}
