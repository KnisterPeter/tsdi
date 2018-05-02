---
id: version-0.20.0-api-lifecyclelistener
title: LifecycleListener
original_id: api-lifecyclelistener
---

```ts
export interface LifecycleListener {
  onCreate?(component: any): void;
  onDestroy?(component: any): void;
}
```
