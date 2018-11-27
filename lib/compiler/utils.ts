import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import * as ts from 'typescript';
import { Navigation } from './navigation';
import { Component } from './types';

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

// todo: refactor from name based search to reference based search
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
): ts.Expression | undefined {
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
    return undefined;
  }
  return property.initializer;
}

export function checkManagedDecorator(
  dependency: ts.ClassDeclaration,
  component: Component
): void {
  if (
    !hasDecorator('managed', dependency) &&
    !component.provider &&
    !hasDecorator('unit', dependency)
  ) {
    throw new Error(
      `Managed dependency '${
        dependency.name!.text
      }' is missing @managed decorator`
    );
  }
}

export function isSingleton(expr: ts.ObjectLiteralExpression): boolean {
  const singleton = getValueFromObjectLiteral(expr, 'singleton');
  return !singleton || singleton.kind !== ts.SyntaxKind.FalseKeyword;
}

export function getMethodReturnType(
  node: ts.MethodDeclaration,
  navigation: Navigation
): ts.ClassDeclaration {
  if (!node.type) {
    throw new Error(
      `@provides requires methods to declare a return type '${node.getText()}`
    );
  }
  let type: ts.Node = node.type;
  if (ts.isTypeReferenceNode(type)) {
    type = type.typeName;
  }
  if (!ts.isIdentifier(type)) {
    throw new Error(`${type.getText()} is an unsupported type declartaion`);
  }

  return findClosestClass(navigation.findDefinition(type));
}

export function findDependencies(
  members: ReadonlyArray<ts.ClassElement>,
  navigation: Navigation
): ts.ClassDeclaration[] {
  return members.map(member => {
    if (ts.isPropertyDeclaration(member)) {
      return findClosestClass(navigation.findDefinition(member));
    }
    throw new Error(`Unknown class element ${member}`);
  });
}
