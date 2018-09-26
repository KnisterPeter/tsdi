import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import * as ts from 'typescript';

export function findTsdiRoot(): string {
  let dir = __dirname;
  while (!existsSync(join(dir, 'package.json'))) {
    dir = dirname(dir);
  }

  const pkg = JSON.parse(readFileSync(join(dir, 'package.json')).toString());
  if (pkg.name === 'tsdi') {
    return dir;
  }
  throw new Error('Unable to locate tsdi root');
}

export function isAbstract(node: ts.Node): boolean {
  if (!node.modifiers) {
    return false;
  }
  return node.modifiers.some(
    modifier => modifier.kind === ts.SyntaxKind.AbstractKeyword
  );
}

export function filter<T extends ts.Node, L extends T[] | ts.NodeArray<T>>(
  list: L,
  test: (node: T) => boolean
): L {
  return (list as T[]).filter(test) as L;
}

export function getDecorator(
  name: string,
  node: ts.ClassDeclaration | ts.MethodDeclaration | ts.PropertyDeclaration
): ts.Decorator | undefined {
  if (!node.decorators) {
    return undefined;
  }

  return node.decorators.find(decorator => {
    if (ts.isIdentifier(decorator.expression)) {
      return decorator.expression.getText() === name;
    } else if (
      ts.isCallExpression(decorator.expression) &&
      ts.isIdentifier(decorator.expression.expression)
    ) {
      return decorator.expression.expression.getText() === name;
    }
    throw new Error(`Unable to detect decorator '${decorator}'`);
  });
}

export function hasDecorator(
  name: string,
  node: ts.ClassDeclaration | ts.MethodDeclaration | ts.PropertyDeclaration
): boolean {
  return getDecorator(name, node) !== undefined;
}

export function findClosestDecoratedNode(decorator: ts.Node): ts.Node {
  let node: ts.Node = decorator;
  while (node !== undefined) {
    if (node.decorators) {
      return node;
    }
    node = node.parent;
  }
  throw new Error('No decorated node found');
}

export function findClosestClass(node: ts.Node): ts.ClassDeclaration {
  while (node && !ts.isClassDeclaration(node)) {
    node = node.parent;
  }
  if (!ts.isClassDeclaration(node)) {
    throw new Error(`Could not find ClassDeclaration for ${node}`);
  }
  return node;
}

export function getConstructor(
  node: ts.ClassDeclaration
): ts.ConstructorDeclaration | undefined {
  return node.members.find(memer =>
    ts.isConstructorDeclaration(memer)
  ) as ts.ConstructorDeclaration;
}

export function getDecoratorParameters(
  node: ts.Decorator
): ReadonlyArray<ts.Node> {
  if (ts.isIdentifier(node.expression)) {
    return [];
  } else if (ts.isCallExpression(node.expression)) {
    return node.expression.arguments;
  }
  throw new Error('Unhandled decorator pattern');
}

export function getValueFromObjectLiteral(
  node: ts.ObjectLiteralExpression,
  name: string
): ts.Expression {
  const property = node.properties.find(property => {
    if (!ts.isPropertyAssignment(property)) {
      throw new Error('Invalid object literal');
    }
    if (!ts.isIdentifier(property.name)) {
      throw new Error('Invalid object literal');
    }
    return property.name.getText() === name;
  }) as ts.PropertyAssignment;
  if (!property) {
    throw new Error(`Property with '${name}' not found in object literal`);
  }
  return property.initializer;
}
