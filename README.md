# tsdi

[![npm](https://img.shields.io/npm/v/tsdi.svg)](https://www.npmjs.com/package/tsdi)
[![GitHub license](https://img.shields.io/github/license/KnisterPeter/tsdi.svg)]()
[![Travis](https://img.shields.io/travis/KnisterPeter/tsdi.svg)](https://travis-ci.org/KnisterPeter/tsdi)
[![Coveralls branch](https://img.shields.io/coveralls/KnisterPeter/tsdi/master.svg)](https://coveralls.io/github/KnisterPeter/tsdi)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Greenkeeper badge](https://badges.greenkeeper.io/KnisterPeter/tsdi.svg)](https://greenkeeper.io/)
[![Standard Version](https://img.shields.io/badge/release-standard%20version-brightgreen.svg)](https://github.com/conventional-changelog/standard-version)

Dependency Injection container (IoC) for TypeScript.

# Features

* Type based dependency injetion
* Type auto registration
* Lifecycle methods
* Interface based injection
* [Name based injection (hints)](#name-based-injection-hints)
* [Property value injection](#property-value-injection-configuration)
* [Constructor injection (parameters)](#constructor-parameter-injection)
* [Singletons vs Instances](#singletons-vs-instances)
* [Factories](#factories)
* [External components (components where the constructor could not be called by tsdi)](#externals)
* [Lazy dependency injection (default)](#lazy-injection)
* [Lifecycle listeners](#lifecycle-listeners)
* [Eager components](#eager-components)
* [Debug logging](#debug-logging)

# Usage

## Installation
Install as npm package:

```sh
npm install tsdi --save
```

Install latest development version:

```sh
npm install tsdi@next --save
```

## API


```js
import { Component } from 'tsdi';

@Component()
export class Dependency {

  public echo(input: string): string {
    return input;
  }

}
```

```js
import { Component, Inject, Initialize } from 'tsdi';
import { Dependency } from './dependency';

@Component()
export class User {

  @Inject()
  private dependency: Dependency;

  private message: string;

  @Initialize()
  public init(): void {
    this.message = 'hello';
  }

  public getDep(): Dependency {
    return this.dependency;
  }

  public method(): string {
    return this.dependency.echo(this.message);
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

### Name based injection (hints)

```js
import { TSDI, Component, Inject } from 'tsdi';

@Component()
class A {}

@Component()
class B extends A {}
@Component({name: 'Bar'})
class C extends A {}

@Component({name: 'Foo'})
class D extends A {
  @Inject({name: 'Bar'})
  private a: A;
}

const tsdi: TSDI = new TSDI();
tsdi.enableComponentScanner();
const a: A = tsdi.get(A, 'Foo');
```

### Constructor parameter injection

```js
import { TSDI, Component, Inject } from 'tsdi';

@Component()
class A {}

@Component()
class B {}

@Component()
class C {
  constructor(@Inject() a: A, @Inject() b: B) {}
}

const tsdi: TSDI = new TSDI();
tsdi.enableComponentScanner();
tsdi.get(C);
```

### Singletons vs. Instances

```js
import { TSDI, Component } from 'tsdi';

@Component({singleton: false})
class A {}

@Component()
class B {}

const tsdi: TSDI = new TSDI();
tsdi.enableComponentScanner();

const a0: A = tsdi.get(A);
const a1: A = tsdi.get(A);
// a0 !== a1

const b0: B = tsdi.get(B);
const b1: B = tsdi.get(B);
// b0 === b1
```

### Factories

```js
import { TSDI, Component, Factory } from 'tsdi';

class A {}

@Component()
class B {
  @Factory()
  public createA(): A {
    return new A();
  }
}

const tsdi: TSDI = new TSDI();
tsdi.enableComponentScanner();

tsdi.get(A);
```

### Property value injection (configuration)

```js
import { TSDI, Component, Inject } from 'tsdi';

@Component()
class A {
  @Inject({name: 'config-key'})
  public some: string;
}

const tsdi: TSDI = new TSDI();
tsdi.addProperty('config-key', 'config-value');
tsdi.register(A);
console.log(tsdi.get(A).some); // 'config-value'
```

### Externals

```js
import { TSDI, Component, External } from 'tsdi';

@Component
class A {}

@Component
class B {}

@External()
class C {
  @Inject()
  public a: A;

  public b: B;

  constructor(@Inject() b: B) {
    this.b = b;
  }

  @Initialize()
  public init() {
  }
}

const tsdi: TSDI = new TSDI();
tsdi.enableComponentScanner();

const c = new C();
console.log(c.a);
```

### Lazy injection

```js
import { TSDI, Component, Inject } from 'tsdi';

@Component()
class A {
  @Inject({lazy: true})
  public some: Dependency;
}

const tsdi: TSDI = new TSDI();
tsdi.register(A);
const a = tsdi.get(A); // <-- at this point a.some is still undefined (not created and not injected)
console.log(a.some); // <-- at this point some is created and return (on first property access)
```

### Lifecycle listeners

```js
import { TSDI, Component, Inject } from 'tsdi';

@component
class A {
}

const tsdi: TSDI = new TSDI();
tsdi.register(A);
tsdi.addLifecycleListener({
  onCreate(component: any): void {
    console.log(component); // <-- this line is executed the first time a component is created
  }
});
const a = tsdi.get(A);
```

### Eager components

```js
import { TSDI, Component, Inject } from 'tsdi';

@component({eager: true})
class A {
}

const tsdi: TSDI = new TSDI();
tsdi.register(A); // <-- here the class A is instantiated
```

### Debug logging

To inspect which component is created when and injected where one can enable debug logging by either
set the environment variable `DEBUG` (node) or a localStorage key (browser) `debug` to `tsdi`.

## Future ideas / Roadmap

* Static factories
* Factories for non classes/types
