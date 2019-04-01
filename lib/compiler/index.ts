import { dirname, join } from 'path';
import resolveFrom from 'resolve-from';
import {
  ClassDeclaration,
  Decorator,
  FunctionDeclaration,
  InterfaceDeclaration,
  KindToNodeMappings,
  MethodDeclaration,
  Project,
  ReferenceEntry,
  SourceFile,
  SyntaxKind,
  TypeGuards
} from 'ts-morph';
import { Component } from './component';
import { Container } from './container';
import { Generator } from './generator';
import { Runtime } from './runtime';
import { DecorableNode, findDeclarationForIdentifier, isDefined } from './util';

export class Compiler {
  public project: Project;

  public readonly componentRegistry: {
    container: Container<any>;
    component: Component;
  }[] = [];

  private _idGen = 1;

  /**
   * @internal
   */
  public get idGen(): string {
    return `C${this._idGen++}`;
  }

  /**
   * @internal
   */
  public generator: Generator;

  /**
   * @internal
   */
  public runtime: Runtime;

  constructor(public tsConfigFilePath: string) {
    this.project = new Project({ tsConfigFilePath });
    this.generator = new Generator(this);
    this.runtime = new Runtime(this);
  }

  public getContainers(): Container<any>[] {
    const clazzes = this.getDecoratedByKind(
      'container',
      SyntaxKind.ClassDeclaration
    );
    if (clazzes.length === 0) {
      throw new Error('No container found');
    }
    return clazzes.map(clazz => new Container(this, clazz));
  }

  public getContainer<T>(name: string): Container<T> {
    const containers = this.getContainers().filter(
      container => container.name === name
    );
    if (containers.length > 1) {
      throw new Error(
        `Multiple containers with name '${name}' found. Container name must be unique`
      );
    }
    return containers[0];
  }

  public getComponents(container: Container<any>): Component[] {
    const clazzes = this.getDecoratedByKind(
      'managed',
      SyntaxKind.ClassDeclaration
    );
    return Array.from(
      new Set(clazzes.map(clazz => new Component(container, clazz)))
    );
  }

  private getDecoratedByKind<TKind extends SyntaxKind>(
    decoratorName: string,
    kind: TKind
  ): KindToNodeMappings[TKind][] {
    const decoratorFunction = this.getDecoratorFunctionOrThrow(decoratorName);
    const references = decoratorFunction
      .findReferences()
      .reduce(
        (refs, ref) => [...refs, ...ref.getReferences()],
        [] as ReferenceEntry[]
      )
      .filter(ref => !ref.isDefinition());
    if (references.length === 0) {
      return [];
    }

    return references.map(reference =>
      reference.getNode().getFirstAncestorByKindOrThrow(kind)
    );
  }

  /**
   * @internal
   */
  public getLegacyComponents(container: Container<any>): Component[] {
    const fn = this.getDecoratorFunction('Component');
    if (!fn) {
      // note: no legacy decorator function found.
      // asume only compiler is used and legacy not available
      return [];
    }
    const components = fn
      .findReferencesAsNodes()
      .map(node => node.getFirstAncestorByKind(SyntaxKind.Decorator))
      .filter(isDefined)
      .map(decorator =>
        decorator.getFirstAncestorByKind(SyntaxKind.ClassDeclaration)
      )
      .filter(isDefined)
      .map(clazz => new Component(container, clazz));
    return Array.from(new Set(components));
  }

  /**
   * @internal
   */
  public getLegacyExternals(container: Container<any>): Component[] {
    const fn = this.getDecoratorFunction('External');
    if (!fn) {
      // note: no legacy decorator function found.
      // asume only compiler is used and legacy not available
      return [];
    }
    const components = fn
      .findReferencesAsNodes()
      .map(node => node.getFirstAncestorByKind(SyntaxKind.Decorator))
      .filter(isDefined)
      .map(decorator =>
        decorator.getFirstAncestorByKind(SyntaxKind.ClassDeclaration)
      )
      .filter(isDefined)
      .map(clazz => new Component(container, clazz));
    return Array.from(new Set(components));
  }

  public getLegacyFactoryNodes(): {
    method: MethodDeclaration;
    node: ClassDeclaration | InterfaceDeclaration;
  }[] {
    const fn = this.getDecoratorFunction('Factory');
    if (!fn) {
      // note: no legacy decorator function found.
      // asume only compiler is used and legacy not available
      return [];
    }
    return fn
      .findReferencesAsNodes()
      .map(node => node.getFirstAncestorByKind(SyntaxKind.Decorator))
      .filter(isDefined)
      .map(decorator =>
        decorator.getFirstAncestorByKind(SyntaxKind.MethodDeclaration)
      )
      .filter(isDefined)
      .map(method => {
        return {
          method,
          identifier: method
            .getReturnTypeNodeOrThrow()
            .getFirstChildByKindOrThrow(SyntaxKind.Identifier)
        };
      })
      .reduce(
        (nodes, { method, identifier }) => {
          const returnTypeNode = findDeclarationForIdentifier(identifier);
          if (
            TypeGuards.isClassDeclaration(returnTypeNode) ||
            TypeGuards.isInterfaceDeclaration(returnTypeNode)
          ) {
            nodes.push({
              method,
              node: returnTypeNode
            });
          }
          return nodes;
        },
        [] as {
          method: MethodDeclaration;
          node: ClassDeclaration | InterfaceDeclaration;
        }[]
      );
  }

  /**
   * @internal
   */
  public getLegacyFactories(
    container: Container<any>
  ): {
    factory: Component;
    method: MethodDeclaration;
    component: Component;
  }[] {
    return this.getLegacyFactoryNodes().map(({ method, node }) => {
      const classNode = method.getFirstAncestorByKindOrThrow(
        SyntaxKind.ClassDeclaration
      );
      return {
        factory: new Component(container, classNode),
        method,
        component: new Component(container, node)
      };
    });
  }

  private getTsdiRoot(): string {
    try {
      return dirname(dirname(resolveFrom('.', 'tsdi')));
    } catch (e) {
      return dirname(dirname(__dirname));
    }
  }

  public getDecorator(
    node: DecorableNode,
    name: string
  ): Decorator | undefined {
    const decoratorNode =
      node.getDecorator(name) || node.getDecorator(name.toLowerCase());
    if (decoratorNode) {
      const identifier = decoratorNode.getFirstDescendantByKind(
        SyntaxKind.Identifier
      );
      if (identifier) {
        const decoratorFunction = this.getDecoratorFunctionOrThrow(name);
        if (decoratorFunction.findReferencesAsNodes().includes(identifier)) {
          return decoratorNode;
        }
      }
    }
    return undefined;
  }

  private getDecoratorFunctionOrThrow(name: string): FunctionDeclaration {
    const fn = this.getDecoratorFunction(name);
    if (!fn) {
      throw new Error(`Unable to find function with name [${name}]`);
    }
    return fn;
  }

  private getDecoratorFunction(name: string): FunctionDeclaration | undefined {
    switch (name.toLowerCase()) {
      case 'component':
      case 'destroy':
      case 'external':
      case 'factory':
      case 'initialize':
      case 'inject':
        const file = this.findLegacyDecoratorsFile(name.toLowerCase());
        return file && file.getFunction(name);
    }
    return this.findDecoratorsFile().getFunction(name);
  }

  private findDecoratorsFile(): SourceFile {
    const decoratorsFilePath = join(
      this.getTsdiRoot(),
      'dist',
      'esm',
      'compiler',
      'decorators.d.ts'
    );

    return this.project.getSourceFileOrThrow(decoratorsFilePath);
  }

  private findLegacyDecoratorsFile(name: string): SourceFile | undefined {
    const decoratorsFilePath = join(
      this.getTsdiRoot(),
      'dist',
      'esm',
      `${name}.d.ts`
    );

    return this.project.getSourceFile(decoratorsFilePath);
  }
}
