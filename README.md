> tsdi

[![npm](https://img.shields.io/npm/v/tsdi.svg)](https://www.npmjs.com/package/tsdi)
[![GitHub license](https://img.shields.io/github/license/KnisterPeter/tsdi.svg)]()
[![Travis](https://img.shields.io/travis/KnisterPeter/tsdi.svg)](https://travis-ci.org/KnisterPeter/tsdi)
[![Coveralls branch](https://img.shields.io/coveralls/KnisterPeter/tsdi/master.svg)](https://coveralls.io/github/KnisterPeter/tsdi)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Standard Version](https://img.shields.io/badge/release-standard%20version-brightgreen.svg)](https://github.com/conventional-changelog/standard-version)
[![renovate badge](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovateapp.com/)

Easy dependency injection for TypeScript.

# Features

* Type based dependency injetion
* Type auto registration
* Lifecycle methods
* Constructor parameters injection
* Singletons and Instances
* External components (components not managed by tsdi)
* Scopes

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
