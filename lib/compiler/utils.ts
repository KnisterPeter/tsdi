import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { createWrappedNode, Decorator, Node, TypeGuards } from 'ts-simple-ast';
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

export function hasDecorator(
  name: string,
  node: ts.ClassDeclaration | ts.MethodDeclaration | ts.PropertyDeclaration
): boolean {
  return createWrappedNode(node).getDecorator(name) !== undefined;
}

export function findClosestDecoratedNode(decorator: ts.Node): ts.Node {
  const node = createWrappedNode(decorator).getFirstAncestor(
    node =>
      TypeGuards.isDecoratableNode(node) && node.getDecorators().length > 0
  );
  if (!node) {
    throw new Error('No decorated node found');
  }
  return node.compilerNode;
}

export function findClosestClass(node: ts.Node): ts.ClassDeclaration {
  const wrappedNode = createWrappedNode(node);

  if (TypeGuards.isClassDeclaration(wrappedNode)) {
    return wrappedNode.compilerNode;
  }
  const clazz = wrappedNode.getFirstAncestorByKind(
    ts.SyntaxKind.ClassDeclaration
  );
  if (!clazz) {
    throw new Error(`Could not find ClassDeclaration for ${node.getText()}`);
  }
  return clazz.compilerNode;
}

export function getConstructor(
  node: ts.ClassDeclaration
): ts.ConstructorDeclaration | undefined {
  const constructors = createWrappedNode(node).getConstructors();
  return constructors && constructors.length > 0
    ? constructors[0].compilerNode
    : undefined;
}

export function getDecoratorParameters(
  node: ts.Decorator
): ReadonlyArray<ts.Node> {
  const decorator = createWrappedNode(node);
  if (decorator.isDecoratorFactory()) {
    return decorator.getArguments().map(argument => argument.compilerNode);
  }
  return [];
}

export function getValueFromObjectLiteral(
  node: ts.ObjectLiteralExpression,
  name: string
): ts.Expression | undefined {
  const ole = createWrappedNode(node);
  const property = ole.getProperty(name);
  if (property) {
    if (TypeGuards.isPropertyAssignment(property)) {
      const initializer = property.getInitializer();
      return initializer ? initializer.compilerNode : undefined;
    }
  }
  return undefined;
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

function getDecorator(
  node: Node<ts.Node>,
  name: string
): Decorator | undefined {
  if (TypeGuards.isDecoratableNode(node)) {
    const decorator = node.getDecorator(name);
    return decorator;
  }
  return undefined;
}

// todo: use smaller methods above
// tslint:disable-next-line:cyclomatic-complexity
export function getDecoratorParameter(
  node: ts.Node,
  decoratorName: string,
  propertyName: string
): ts.Expression | undefined {
  const wrappedNode = createWrappedNode(node);

  const decorator = getDecorator(wrappedNode, decoratorName);
  if (!decorator) {
    return undefined;
  }
  const args = decorator.getArguments();
  if (args.length === 0) {
    return undefined;
  }
  const arg = args[0];
  if (!TypeGuards.isObjectLiteralExpression(arg)) {
    return undefined;
  }
  const property = arg.getProperty(propertyName);
  if (!property || !TypeGuards.isPropertyAssignment(property)) {
    return undefined;
  }
  const initializer = property.getInitializer();
  return initializer ? initializer.compilerNode : undefined;
}
