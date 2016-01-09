# tsdi

[![GitHub license](https://img.shields.io/github/license/KnisterPeter/tsdi.svg)]()
[![Travis](https://img.shields.io/travis/KnisterPeter/tsdi.svg)](https://travis-ci.org/KnisterPeter/tsdi)
[![Coveralls branch](https://img.shields.io/coveralls/KnisterPeter/tsdi/master.svg)](https://coveralls.io/github/KnisterPeter/tsdi)
[![David](https://img.shields.io/david/KnisterPeter/tsdi.svg)](https://david-dm.org/KnisterPeter/tsdi)
[![David](https://img.shields.io/david/dev/KnisterPeter/tsdi.svg)](https://david-dm.org/KnisterPeter/tsdi#info=devDependencies&view=table)
[![npm](https://img.shields.io/npm/v/react-to-typescript-definitions.svg)](https://www.npmjs.com/package/tsdi)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

Dependency Injection container (IoC) for TypeScript.

# Usage

## Installation
Install as npm package:

```sh
npm install tsdi --save
```

## API


```js
import { Component } from 'tsdi';

@Component
export class Dependency {

  public echo(input: string): string {
    return input;
  }

}
```

```js
import { Component, Inject } from 'tsdi';
import { Dependency } from './dependency';

@Component
export class User {

  @Inject
  private dependency: Dependency;

  public getDep(): Dependency {
    return this.dependency;
  }

  public method(): string {
    return this.dependency.echo('hello');
  }

}
```

```js
import { TSDI } from 'tsdi';
import { User } from './user';
import { Dependency } from './dependency';

const tsdi: TSDI = new TSDI();
tsdi.register(User);
tsdi.register(Dependency);
const user: User = tsdi.get(User);
console.log(user.method()); // outputs 'hello'
```
