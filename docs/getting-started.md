---
id: getting-started
title: Getting Started
---

Getting started with TSDI as dependency injection container in your project.

## Installation

Install as npm package:

```sh
$ yarn add tsdi
```

or

```sh
$ npm install tsdi --save
```

## Compiler configuration

You need to enable decorator metadata in your `tsconfig.json`, which is done by adding the following line:

```
{
  "compilerOptions": {
    ...
    "emitDecoratorMetadata": true
  }
}
```

TSDI uses the metadata to build a dependency tree of your components.

## Create the container

TSDI will keep and inject dependencies which would otherwise need to be handed down manually or kept as singleton.

You need to create an instance of the TSDI container and register your
components to it.

```ts
import { TSDI } from 'tsdi';

const tsdi = new TSDI();
```

## Decorate your components

Classes of which instances should be kept and injectable have to be marked with the `@component` decorator.

Each class marked with `@component` will be tracked by TSDI as well as instanced together with the container instance.

```ts
// ...

@component
class Database {
  public query(statement: string): Promise {
    // ...
  }
}
```

In order to connect dependencies add a `@inject` decorated property with the required type to a component.

```ts
// ...

@component
class User {
  @inject private db!: Database;

  public load(id: number): Promise {
    return this.db.query('select * from ...');
  }
}
```

## Register all components

Your components need to be registered in the TSDI instance
so a dependency graph could be created from all parts of
your system.

```ts
// ...

tsdi.register(Database);
tsdi.register(User);
```

## Start using your components

To access components use `TSDI#get(Component)`.
TSDI will create the requested component for you and
return it - configured with all required dependencies -
to you.

```ts
// ...

const user = tsdi.get(User);
user.load(1).then((data) => {
  // ...
});
```

## All together

All parts together as one example.

```ts
import { TSDI } from 'tsdi';

const tsdi = new TSDI();

@component
class Database {
  public query(statement: string): Promise {
    // ...
  }
}

@component
class User {
  @inject private db!: Database;

  public load(id: number): Promise {
    return this.db.query('select * from ...');
  }
}

tsdi.register(Database);
tsdi.register(User);

const user = tsdi.get(User);
user.load(1).then((data) => {
  // ...
});
```
