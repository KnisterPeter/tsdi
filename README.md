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
* [Lifecycle methods](#lifecycle-methods)
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
* [Automocks](#automocks)

# Usage

## Installation
Install as npm package:

```sh
npm install tsdi --save
```

You need to enable decorator metadata in your `tsconfig.json`, which is done by adding the following line:

```
"emitDecoratorMetadata": true
```

Otherwise TSDI will not be able to infer the types of some factories and components.

## API

TSDI will keep and inject dependencies for you which would otherwise need to be handed down manually
or kept as singleton.

Classes of which instances should be kept and injectable have to be marked with the `@Component()` decorator.

Each class marked with `@Component()` will be tracked by TSDI as well as instanced together with the container
instance.


```js
import { Component } from 'tsdi';

@Component()
export class Dependency {

  public echo(input: string): string {
    return input;
  }

}
```

In order to later use the dependencies somewhere simply define a property with the same type and add the `@Inject`
decorator to it.

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

You need to create an instance of the TSDI container somewhere in your code,
for example with `const tsdi = new TSDI()`.

For now let us register all components manually to this container by calling `tsdi.register` with the class,
but it is also possible have them discovered automatically by doing: `tsdi.enableComponentScanner()`.

Please note that when using `enableComponentScanner()` all `@Component()`s have to be imported. Make sure that
your bundler (such as webpack) did not optimize the `import` statement away.

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

Instead of using the type of the component (the type of the class) as identifier for injection it is also possible to
specify the name as a custom string as depicted in the following example:

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

This can be particularly useful if you have certain circular dependencies which can not be expressed without
name based injection.

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

### Lifecycle methods

To hook into component creation and destruction there are two
decorators available. `@initialize` and `@destroy`.
They are call on the respective lifecycle event.

```js
import { component, initialize, destroy } from 'tsdi';

@component
export class User {

  private timer: NodeJS.Timer;

  @initialize
  public init(): void {
    this.timer = setInterval(() => {
      // do someting ...
    }, 100);
  }

  @destroy
  public destroy(): void {
    clearInterval(this.timer);
  }

}
```

### Singletons vs. Instances

Sometimes it can be useful to inject a new instance of a Component everytime it is injected. In order to achieve this
you can configure the component to not be singleton `{ singleton: false }` and a new instance will be created everytime
it is retrieved or injected.

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

In cases in which you need to be able to inject dependencies which are not just classes but objects (interfaces) or
simply not maintained by you it is possible to define a `@Factory()` which creates these dependencies and makes them
injectable:

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

Please note that the return-type of the factory needs to be deductable by the `Reflection` api and if it is not you
will need to use name based injection.

### Property value injection (configuration)

In cases in which it is necessary to simply inject a single atomic value, as for example a config value, it is possible
to define a property using `tsdi.addProperty(...)`. it can then be injected normally using name based injection.

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

You should not use property value injection to inject complex structures, objects or instances of classes. Consider
using a `@Factory()` instead.

### Externals

Sometimes (for example when dealing with React) it is necessary to inject dependencies into classes which are not
`@Components()` themself and which should not be augmented by TSDI. As TSDI overrides the `constructor()` of all
classes which use TSDI it is necessary to mark these classes (for example every React component) using the
`@External()` decorator.

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

You can mark individual injections as `{ lazy: true }`, which will lead to the injected `@Component()`s being
created only when they are first touched.

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
  onDestroy(component: any): void {
    console.log(component); // <-- this line is executed a component is destroyed (e.g. container close)
  }
});
const a = tsdi.get(A);
tsdi.close();
```

### Eager components

You can mark an individual `@Component()` as `{ eager: true }` which will make sure that this component
is instanced as soon as it is discovered by TSDI.

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

### Automocks

```js
import { TSDI, component, inject, initialize } from 'tsdi';

@component
class Foo {
  public foo(): void {
  }
}

@component
class Bar {
  public bar(): string {
    return 'bar';
  }
}

@component
class Baz {
  @inject
  public foo: Foo;
  @inject
  public bar: Bar;

  @initialize
  protected init(): void {
    this.foo.foo();
    console.log(this.bar.bar()); // <-- logs 'bar' since this.bar is not mocked
  }
}

// This means: create mocks for all inject but 'Bar'
tsdi.enableAutomock(Bar);
tsdi.get(Baz);
```

### Alternative Syntax

Each decorator can be written in uppercase: `@Component()` as well as lowercase: `@component()` in order
to stay more consistent with the rest of the Typescript ecosystem. Empty parens can be omitted, so
`@component()` can be written as `@component`.

## Future ideas / Roadmap

* Static factories
* Factories for non classes/types
