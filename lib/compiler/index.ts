import { dirname, join } from 'path';
import resolveFrom from 'resolve-from';
import {
  ClassDeclaration,
  InterfaceDeclaration,
  MethodDeclaration,
  Project,
  ReferenceEntry,
  SourceFile,
  SyntaxKind,
  TypeGuards,
  VariableDeclaration
} from 'ts-morph';
import { Component } from './component';
import { Container } from './container';
import { Generator } from './generator';
import { Runtime } from './runtime';
import { findDeclarationForIdentifier } from './util';

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
    const decoratorsFile = this.findDecoratorsFile();
    const containerFunction = decoratorsFile.getFunctionOrThrow('container');
    const references = containerFunction
      .findReferences()
      .reduce(
        (refs, ref) => [...refs, ...ref.getReferences()],
        [] as ReferenceEntry[]
      )
      .filter(ref => !ref.isDefinition());
    if (references.length === 0) {
      throw new Error('No container found');
    }

    const clazzes = references.map(reference =>
      reference
        .getNode()
        .getFirstAncestorByKindOrThrow(SyntaxKind.ClassDeclaration)
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
    if (containers.length === 0) {
      throw new Error('No container found');
    }
    if (containers.length > 1) {
      throw new Error(
        `Multiple containers with name '${name}' found. Container name must be unique`
      );
    }
    return containers[0];
  }

  public getComponents(container: Container<any>): Component[] {
    const decoratorsFile = this.findDecoratorsFile();
    const managed = decoratorsFile.getFunctionOrThrow('managed');
    const references = managed
      .findReferences()
      .reduce(
        (refs, ref) => [...refs, ...ref.getReferences()],
        [] as ReferenceEntry[]
      )
      .filter(ref => !ref.isDefinition());
    if (references.length === 0) {
      return [];
    }

    const clazzes = references.map(reference =>
      reference
        .getNode()
        .getFirstAncestorByKindOrThrow(SyntaxKind.ClassDeclaration)
    );
    if (clazzes.length === 0) {
      throw new Error('No container found');
    }
    return Array.from(
      new Set(clazzes.map(clazz => new Component(container, clazz)))
    );
  }

  /**
   * @internal
   */
  public getLegacyComponents(container: Container<any>): Component[] {
    const decoratorsFile = this.findLegacyDecoratorsFile('component');
    const component = decoratorsFile.getExportedDeclarations()[2] as VariableDeclaration;
    const references = component
      .findReferences()
      .reduce(
        (refs, ref) => [...refs, ...ref.getReferences()],
        [] as ReferenceEntry[]
      )
      .filter(ref => !ref.isDefinition());
    if (references.length === 0) {
      return [];
    }

    const clazzes = references.map(reference =>
      reference
        .getNode()
        .getFirstAncestorByKindOrThrow(SyntaxKind.ClassDeclaration)
    );
    if (clazzes.length === 0) {
      return [];
    }
    return Array.from(
      new Set(clazzes.map(clazz => new Component(container, clazz)))
    );
  }

  /**
   * @internal
   */
  public getLegacyExternals(container: Container<any>): Component[] {
    const decoratorsFile = this.findLegacyDecoratorsFile('external');
    const external = decoratorsFile.getExportedDeclarations()[2] as VariableDeclaration;
    const references = external
      .findReferences()
      .reduce(
        (refs, ref) => [...refs, ...ref.getReferences()],
        [] as ReferenceEntry[]
      )
      .filter(ref => !ref.isDefinition());
    if (references.length === 0) {
      return [];
    }

    const clazzes = references.map(reference =>
      reference
        .getNode()
        .getFirstAncestorByKindOrThrow(SyntaxKind.ClassDeclaration)
    );
    if (clazzes.length === 0) {
      return [];
    }
    return Array.from(
      new Set(clazzes.map(clazz => new Component(container, clazz)))
    );
  }

  public getLegacyFactoryNodes(): {
    method: MethodDeclaration;
    node: ClassDeclaration | InterfaceDeclaration;
  }[] {
    const decoratorsFile = this.findLegacyDecoratorsFile('factory');
    const factory = decoratorsFile.getExportedDeclarations()[2] as VariableDeclaration;
    const references = factory
      .findReferences()
      .reduce(
        (refs, ref) => [...refs, ...ref.getReferences()],
        [] as ReferenceEntry[]
      )
      .filter(ref => !ref.isDefinition());
    if (references.length === 0) {
      return [];
    }

    return references
      .map(reference => {
        const method = reference
          .getNode()
          .getFirstAncestorByKindOrThrow(SyntaxKind.MethodDeclaration);
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

  private findLegacyDecoratorsFile(name: string): SourceFile {
    const decoratorsFilePath = join(
      this.getTsdiRoot(),
      'dist',
      'esm',
      `${name}.d.ts`
    );

    return this.project.getSourceFileOrThrow(decoratorsFilePath);
  }
}
