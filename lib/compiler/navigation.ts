import * as ts from 'typescript';
import { DefinitionNotFoundError } from './errors';

export class Navigation {
  private static getAllFunctions(node: ts.Node): ts.FunctionDeclaration[] {
    if (ts.isFunctionDeclaration(node)) {
      return [node];
    } else {
      const functions: ts.FunctionDeclaration[] = [];
      node.forEachChild(child => {
        functions.push(...Navigation.getAllFunctions(child));
      });
      return functions;
    }
  }

  private static findNodeByPosition(
    node: ts.Node,
    start: number,
    end: number
  ): ts.Node | undefined {
    if (node.getStart() === start && node.end === end) {
      return node;
    } else if (node.getStart() <= start) {
      for (let i = 0, n = node.getChildCount(); i < n; i++) {
        const child = node.getChildAt(i);
        const result = this.findNodeByPosition(child, start, end);
        if (result) {
          return result;
        }
      }
    }
    return undefined;
  }

  constructor(private readonly services: ts.LanguageService) {}

  public findFunction(
    filename: string,
    functionName: string
  ): ts.FunctionDeclaration {
    const sourceFile = this.services.getProgram()!.getSourceFile(filename);
    if (!sourceFile) {
      throw new Error(`SourceFile '${filename}' not found.`);
    }
    const functions: ts.FunctionDeclaration[] = Navigation.getAllFunctions(
      sourceFile
    );

    const match = functions.find(declaration => {
      if (declaration.name) {
        return declaration.name.text === functionName;
      }
      return false;
    });
    if (!match) {
      throw new Error(`No function with name '${functionName}' found.`);
    }
    return match;
  }

  // tslint:disable-next-line:cyclomatic-complexity
  public findDefinition(
    node: ts.PropertyDeclaration | ts.ParameterDeclaration | ts.Identifier
  ): ts.Node {
    let type: ts.Node;
    if (ts.isIdentifier(node)) {
      type = node;
    } else {
      if (!node.type) {
        throw new Error(`Type definition required for '${node.getText()}'`);
      }
      type = node.type;
    }

    const sourceFile = node.getSourceFile();
    const filename = sourceFile.fileName;

    const definitions = this.services.getDefinitionAtPosition(
      filename,
      type.getStart()
    );
    if (!definitions) {
      throw new DefinitionNotFoundError(
        `Definition of '${type.getText(type.getSourceFile())}' not found`
      );
    }

    if (definitions.length > 1) {
      throw new Error(`Ambigous definitions for '${node.getText()}' found`);
    }
    const definition = definitions[0];

    const definitionFile = this.services
      .getProgram()!
      .getSourceFile(definition.fileName);
    if (!definitionFile) {
      throw new Error(
        `Inconsistent definition found for '${definition.fileName}'`
      );
    }

    const definitionNode = Navigation.findNodeByPosition(
      definitionFile,
      definition.textSpan.start,
      definition.textSpan.start + definition.textSpan.length
    );
    if (!definitionNode) {
      throw new Error('No node for definition found');
    }
    return definitionNode;
  }

  public findUsages(node: ts.Identifier): ts.Node[];
  public findUsages(node: ts.FunctionDeclaration): ts.Node[];
  public findUsages(node: ts.Identifier | ts.FunctionDeclaration): ts.Node[] {
    let name: ts.Identifier;
    if (!ts.isIdentifier(node)) {
      if (!node.name) {
        throw new Error(
          'Finding usage of function like nodes without name is not implemented'
        );
      }
      name = node.name;
    } else {
      name = node;
    }

    const sourceFile = node.getSourceFile();
    const filename = sourceFile.fileName;

    const referencedSymbols = this.services.findReferences(
      filename,
      name.getStart()
    );
    if (!referencedSymbols) {
      throw new Error('No references found');
    }

    const usingReferences = referencedSymbols.reduce(
      (using, symbol) => {
        return [
          ...using,
          ...symbol.references.filter(reference => !reference.isDefinition)
        ];
      },
      [] as ts.DocumentSpan[]
    );

    return usingReferences.map(reference => {
      const referenceFile = this.services
        .getProgram()!
        .getSourceFile(reference.fileName);
      if (!referenceFile) {
        throw new Error(
          `Inconsistent reference found for '${reference.fileName}'`
        );
      }

      const refNode = Navigation.findNodeByPosition(
        referenceFile,
        reference.textSpan.start,
        reference.textSpan.start + reference.textSpan.length
      );
      if (!refNode) {
        throw new Error('No node for reference found');
      }
      return refNode;
    });
  }
}
