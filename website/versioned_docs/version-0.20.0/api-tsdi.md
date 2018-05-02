---
id: version-0.20.0-api-tsdi
title: TSDI
original_id: api-tsdi
---

## constructor

```ts
new TSDI();
```

## addLifecycleListener

```ts
addLifecycleListener(lifecycleListener: LifecycleListener): void;
```

Register a [LifecycleListener](api-lifecyclelistener.md) in this instance.
This listeners will be called whenever a component is created
or destoryed.

## addProperty

```ts
addProperty(key: string, value: any): void;
```

Add a simple property as injectable to the container instance.
This should mainly be used to setup configuration and other simple
properties.

## close

```ts
close(): void;
```

Shutdown this TSDI instance and destroys all created components.

## enableComponentScanner

```ts
enableComponentScanner(): void;
```

Enables [component scanner mode](features.md#component-scanner).

## enableAutomock

```ts
enableAutomock(...allowedDependencies: any[]): void;
```

Enables [automock mode](features.md#automocks).

## register

```ts
register(component: Constructable<any>, name?: string): void;
```

Registers `component` as Component in this instance.

If `name` is given it could be used for [name based injection](features.md#name-based-injection-hints).

## mock

```ts
mock<T>(component: Constructable<T>): Mock<T>;
```

The mock method could be used to customize an [automock](features.md#automocks)
of the given `component`. This only works if automocks are enabled.

## get

```ts
get<T>(componentOrHint: string | Constructable<T>): T;
```

```ts
get<T>(component: Constructable<T>, hint: string): T;
```

Creates and returns a component of type `T` from this instance.
If `hint` is given [name based injection](features.md#name-based-injection-hints)
is used for component resolution.

## override

```ts
override(component: Constructable<any>, override: any): void;
```

Overrides the `component` with `override` on all subsequent `get()` calls.
This simplifies mocking in tests a lot.

## getScope

```ts
getScope(name: string): {
    enter(): void;
    leave(): void;
};
```

Returns the `name`d [scope](features.md#scopes) which could then be entered or left.
