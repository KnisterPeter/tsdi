import {
  ClassDeclaration,
  Identifier,
  KindToExpressionMappings,
  MethodDeclaration,
  Node,
  ParameterDeclaration,
  PropertyDeclaration,
  SyntaxKind,
  ts,
  TypeGuards
} from 'ts-morph';

export function findDeclarationForIdentifier(
  identifier: Identifier
): Node<ts.Node> {
  const definitions = identifier.getDefinitions();
  if (definitions.length === 0) {
    throw new Error('Invalid unit: ' + identifier.print());
  }
  const node = definitions[0].getDeclarationNode();
  if (!node) {
    throw new Error(
      'Declaration of identifier not found: ' + identifier.print()
    );
  }
  return node;
}

// tslint:disable-next-line:cyclomatic-complexity
export function getDecoratorPropertyInitializer<TKind extends SyntaxKind>(
  node:
    | ClassDeclaration
    | PropertyDeclaration
    | MethodDeclaration
    | ParameterDeclaration,
  decoratorName: string,
  propertyName: string,
  kind?: TKind
): KindToExpressionMappings[TKind] | undefined {
  // todo: check if its the correct decorator
  const decorator = node.getDecorator(decoratorName);
  if (!decorator || !decorator.isDecoratorFactory()) {
    return undefined;
  }
  const config = decorator.getArguments()[0];
  if (!config || !TypeGuards.isObjectLiteralExpression(config)) {
    throw new Error(
      `Invalid ${decoratorName} configuration: ${decorator.print()}`
    );
  }
  const property = config.getProperty(propertyName);
  if (!property || !TypeGuards.isPropertyAssignment(property)) {
    return undefined;
  }
  return kind ? property.getInitializerIfKind(kind) : property.getInitializer();
}

export function getBooleanDecoratorProperty(
  node:
    | ClassDeclaration
    | PropertyDeclaration
    | MethodDeclaration
    | ParameterDeclaration,
  decoratorName: string,
  propertyName: string
): boolean | undefined {
  const value = getDecoratorPropertyInitializer(
    node,
    decoratorName,
    propertyName
  );
  if (!value || !TypeGuards.isBooleanLiteral(value)) {
    return undefined;
  }
  return value.getKind() === SyntaxKind.TrueKeyword;
}

export function getStringDecoratorProperty(
  node:
    | ClassDeclaration
    | PropertyDeclaration
    | MethodDeclaration
    | ParameterDeclaration,
  decoratorName: string,
  propertyName: string
): string | undefined {
  const value = getDecoratorPropertyInitializer(
    node,
    decoratorName,
    propertyName
  );
  if (!value || !TypeGuards.isStringLiteral(value)) {
    return undefined;
  }
  return value.getText();
}
