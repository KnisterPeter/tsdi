---
id: features
title: Features
---

## Component Scanner

To automatically register all decorated components in a
container instance the method [`enableComponentScanner()`](api-tsdi.md#enablecomponentscanner) need
to be called on the instance.

> Please note that when using `enableComponentScanner()` all components have to be imported. Make sure that your bundler (such as webpack) did not optimize the `import` statement away.

## Lifecycle methods

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

## Name based injection (hints)

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

## Property value injection (configuration)

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

## Constructor parameter injection

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

## Singletons vs. Instances

Sometimes it can be useful to inject a new instance of a Component everytime it is injected. In order to achieve this
you can configure the component to not be singleton `{ singleton: false }` and a new instance will be created everytime
it is retrieved or injected.

```js
import { TSDI, Component } from 'tsdi';

@Component({ singleton: false })
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

## Factories

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

> Please note that the return-type of the factory needs to be deductable by the `Reflection` api and if it is not you will need to use name based injection.

## Lazy injection

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

## Lifecycle listeners

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

## Eager components

You can mark an individual `@Component()` as `{ eager: true }` which will make sure that this component
is instanced as soon as it is discovered by TSDI.

```js
import { TSDI, Component, Inject } from 'tsdi';

@component({ eager: true })
class A {}

const tsdi: TSDI = new TSDI();
tsdi.register(A); // <-- here the class A is instantiated
```

## Debug logging

To inspect which component is created when and injected where one can enable debug logging by either
set the environment variable `DEBUG` (node) or a localStorage key (browser) `debug` to `tsdi`.

## Automocks

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

## Scopes

Scopes could be seen as lifecycle bounds for a managed dependency.
By that it is meant that components with a defined scope are only as long as
the scope is entered/valid.

```js
import { TSDI, component, destroy } from 'tsdi';

@component({scope: 'some-scope'})
class Foo {
  @destroy
  private close(): void {
    // free resources...
  }
}

tsdi.get(Foo); // <-- will throw since the scope was not entered
tsdi.getScope('some-scope').enter();
tsdi.get(Foo); // <-- will return a new Foo
tsdi.getScope('some-scope').leave();
// Foo is destructed
tsdi.getScope('some-scope').enter();
tsdi.get(Foo); // <-- will return a new Foo
```

Whenever a scope is left, the lifecycle callbacks are executed. In the above
example the `close` method is invoked.

> Currently it is valid to inject scoped components into unscoped components which will lead to stale dependencies, since TSDI does not clear out injected dependencies as components are destructed.

## Dynamic Injections

The dynamic setting on an injected dependency marks it as dependency to
be reevaluated on every access.  
This means it is a dependency which could be come and go every moment and prior
to access an application should check the availability.  
This also means it could be dynamic dependencies which could could be injected
in more static ones.

```js
import { TSDI, component, inject } from 'tsdi';

@component({scope: 'some-scope'})
class Foo {
  public foo(): void {
    // do something
  }
}

@component
class Bar {
  @inject({dynamic: true})
  private foo: Foo;

  public bar(): void {
    this.foo.foo();
  }
}

const bar = tsdi.get(Bar); // <-- bar is constructed without a foo
bar.bar() // <-- this will throw, since foo is not available
tsdi.getScope('some-scope').enter();
bar.bar() // <-- this will be okay, since foo is available here
tsdi.getScope('some-scope').leave();
bar.bar() // <-- this will throw, since foo is not available
tsdi.getScope('some-scope').enter();
bar.bar() // <-- this will be okay, since a new foo is available here
```

## StrictPropertyInitialization

The new `--strictPropertyInitialization` in TypeScript 2.7 could be used with TSDI by
using the _definite assignment assertion modifiers_.

```js
import { component, inject } from 'tsdi';

@component
class Foo {
}

@component
class Bar {
  @inject
  private foo!: Foo; // note the ! here. It will supress the initialization error
}
```

## Async Dependencies

Components can have `@initialize` methods which are typed `async` or declare `Promise` as return type.  
**note**: It is not sufficient to just return a `Promise` since then the typescript compiler _may_
not detect the async nature of the method.

When injected into another component the depending component's `@initialize` method will be called
after the dependencies initializer has resolved. This is for example useful when injecting a
something like a database connection which needs asynchronous setup code:

```js
import { component, inject } from 'tsdi';

@component
class DatabaseConnection {
  public connection?;

  @initialize
  private async initialize() {
    this.connection = await connectToDatabase();
  }
}

@component
class RestApi {
  @inject private db!: DatabaseConnection;

  @initialize
  private initialize() {
    // This initializer will be called after the database was injected.
    console.log(this.db.connection.query('SELECT * FROM user'));
  }
}
```

> This does not work with dynamic injections and will throw an error. Please note that async injections can not be lazy and will not be lazy by default.

## Configured sets

A container instance could be configured from a configuration class. This configuration could be used to limit the container visible components.

When using [`enableComponentScanner()`](api-tsdi.md#enablecomponentscanner) all components of the whole project are added to the container instance. This is often not whats required or useful.  
There are multiple ways around this and configured sets are one of them.

Another reason to give your container a bit more structure is, if you need to have multiple container with different sets of components to create a hierarchy. This isn't possible with [`externals`](externals.md#external-dependencies) otherwise. These are only working with `enableComponentScanner()` otherwise.

> Just like with `enableComponentScanner()`, externals with configured sets could only occur in one container at once. It does not even give a good error message when misconfigured.

```js
@component
class Dice {
  public roll(): number {
    return 1;
  }
}

class Player {
  constructor(public dice: Dice) {
  }
}

class Game {
  constructor(private player: Player) {}

  public start(): void {
    this.player.dice.roll();
  }
}

@external
class UI {
  @inject
  private readonly game!: Game;

  public render(): void {
    // ...
  }
}

class Config {
  @configure
  public dice!: Dice;

  @configure
  public ui!: UI;

  @configure
  public player(): Player {
    return new Player(this.dice());
  }

  @configure
  public game(): Game {
    return new Game(this.player());
  }
}

const tsdi = new TSDI(new Config());
const game = tsdi.get(Game);
game.start();

const ui = tsdi.get(UI);
ui.render();
```
