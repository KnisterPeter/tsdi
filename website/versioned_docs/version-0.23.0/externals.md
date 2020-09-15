---
id: version-0.23.0-externals
title: Externals
original_id: externals
---

## External dependencies

Sometimes (for example when dealing with React components) it is necessary to inject
dependencies into classes which are not `@Components()` themself and which could
not be managed by TSDI.  
This most likely happens if a third-party library creates your components using `new`.

In this cases your components should be marked with the `@external` decorator.  
The decorator overrides the `constructor()` of all components and injects dependencies
even if the lifecycle is uncontrolled.

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

## externalContainerResolver

To locate the container from external scope (internally to TSDI) the static method
[`externalContainerResolver`](api-tsdi.md#tsdiexternalcontainerresolver-static) exists. By default it has a reference to the last created
TSDI instance (most likely you have one container in production).

To be more customizable (for example have one container per request)
it is possible to overwrite this method and resolve the required TSDI instance by yourself.

```js
const createNamespace = require('cls-hooked').createNamespace;
const local = createNamespace('local');

TSDI.externalContainerResolver = () => local.get('tsdi');

server((req, res) => {
  // incoming http request
  local.run(() => {
    const tsdi = new TSDI();
    try {
      local.set('tsdi', tsdi);

      // handle request
    } finally {
      containers.delete(req);
      tsdi.close();
    }
  });
});
```
