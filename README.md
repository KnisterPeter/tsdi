> tsdi

[![Github Workflow](https://github.com/knisterpeter/tsdi/workflows/Build%20and%20Test/badge.svg)](https://github.com/KnisterPeter/tsdi/actions)
[![npm](https://img.shields.io/npm/v/tsdi.svg)](https://www.npmjs.com/package/tsdi)
[![GitHub license](https://img.shields.io/github/license/KnisterPeter/tsdi.svg)]()
[![codecov](https://codecov.io/gh/KnisterPeter/tsdi/branch/master/graph/badge.svg)](https://codecov.io/gh/KnisterPeter/tsdi)
[![renovate badge](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovateapp.com/)

Easy dependency injection for TypeScript.

# Features

- Type based dependency injection
- Type auto registration
- Lifecycle methods
- Constructor parameters injection
- Singletons and Instances
- External components (components not managed by tsdi)
- Scopes

# Installation

Install as npm package:

```sh
$ yarn add tsdi
```

or

```sh
npm install tsdi --save
```

You need to enable decorator metadata in your `tsconfig.json`, which is done by adding the following line:

```
"emitDecoratorMetadata": true
```

Otherwise TSDI will not be able to infer the types of some factories and components.

# Documentation

See https://tsdi.js.org/

---

Released under MIT license - (C) 2018 Markus Wolf
