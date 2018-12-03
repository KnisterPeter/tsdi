# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="1.0.0-alpha.2"></a>
# [1.0.0-alpha.2](https://github.com/KnisterPeter/tsdi/compare/v1.0.0-alpha.1...v1.0.0-alpha.2) (2018-12-03)


### Bug Fixes

* add basic module resolution ([a42bb14](https://github.com/KnisterPeter/tsdi/commit/a42bb14))
* iterate over prototype property descriptors ([6df6a2f](https://github.com/KnisterPeter/tsdi/commit/6df6a2f))
* missing scope in configuration ([e48768e](https://github.com/KnisterPeter/tsdi/commit/e48768e))
* throw on unassigned externals ([6e1822f](https://github.com/KnisterPeter/tsdi/commit/6e1822f))
* update dependency debug to v4 ([c2979a7](https://github.com/KnisterPeter/tsdi/commit/c2979a7))
* update dependency debug to v4.1.0 ([058357d](https://github.com/KnisterPeter/tsdi/commit/058357d))
* use decorators declaration file ([27ecd1d](https://github.com/KnisterPeter/tsdi/commit/27ecd1d))


### Features

* accept classic components ([324de2e](https://github.com/KnisterPeter/tsdi/commit/324de2e))
* add classic scope, singleton and lifecycles ([f9117dd](https://github.com/KnisterPeter/tsdi/commit/f9117dd))
* add cli ([0bc8693](https://github.com/KnisterPeter/tsdi/commit/0bc8693))
* add compatibility for property inject ([1c3cdd6](https://github.com/KnisterPeter/tsdi/commit/1c3cdd6))
* add destroy lifecycle ([9609c57](https://github.com/KnisterPeter/tsdi/commit/9609c57))
* add initializer decorator ([3cd0d95](https://github.com/KnisterPeter/tsdi/commit/3cd0d95))
* add static compiler ([7fa1b0f](https://github.com/KnisterPeter/tsdi/commit/7fa1b0f))
* add static scope api ([fe408a5](https://github.com/KnisterPeter/tsdi/commit/fe408a5))
* allow external components to be managed ([af37dde](https://github.com/KnisterPeter/tsdi/commit/af37dde))
* allow legacy external inject ([b3afb6b](https://github.com/KnisterPeter/tsdi/commit/b3afb6b))
* allow lifecycle on externals ([e19ec26](https://github.com/KnisterPeter/tsdi/commit/e19ec26))
* allow non singleton factories ([a05bd30](https://github.com/KnisterPeter/tsdi/commit/a05bd30))
* allow static non singleton instances ([cbfdcc8](https://github.com/KnisterPeter/tsdi/commit/cbfdcc8))
* error if invalid unassigned externals ([bbe0d8b](https://github.com/KnisterPeter/tsdi/commit/bbe0d8b))
* export decorators for ease of use ([297870a](https://github.com/KnisterPeter/tsdi/commit/297870a))
* make managed flag mandatory to document component handling ([9bd7171](https://github.com/KnisterPeter/tsdi/commit/9bd7171))
* only use static api to configure container ([c360358](https://github.com/KnisterPeter/tsdi/commit/c360358))
* support legacy factories ([834bcda](https://github.com/KnisterPeter/tsdi/commit/834bcda))



<a name="1.0.0-alpha.1"></a>
# [1.0.0-alpha.1](https://github.com/KnisterPeter/tsdi/compare/v1.0.0-alpha.0...v1.0.0-alpha.1) (2018-09-04)


### Bug Fixes

* update mocks to new mapped types ([361cc74](https://github.com/KnisterPeter/tsdi/commit/361cc74))
* use default import for debug ([dbbddf6](https://github.com/KnisterPeter/tsdi/commit/dbbddf6)), closes [#312](https://github.com/KnisterPeter/tsdi/issues/312)


### Features

* add container resolution strategy for externals ([ae8f53f](https://github.com/KnisterPeter/tsdi/commit/ae8f53f)), closes [#268](https://github.com/KnisterPeter/tsdi/issues/268)
* add static factory setup ([d71f3f1](https://github.com/KnisterPeter/tsdi/commit/d71f3f1))
* allow to describe static dependency tree ([86d3074](https://github.com/KnisterPeter/tsdi/commit/86d3074))



<a name="1.0.0-alpha.0"></a>
# [1.0.0-alpha.0](https://github.com/KnisterPeter/tsdi/compare/v0.20.2...v1.0.0-alpha.0) (2018-05-01)


### Bug Fixes

* add missing return ([a79a230](https://github.com/KnisterPeter/tsdi/commit/a79a230))
* handle deeper async structures ([2bbf85a](https://github.com/KnisterPeter/tsdi/commit/2bbf85a))
* mark components as async during registration phase ([483a5fa](https://github.com/KnisterPeter/tsdi/commit/483a5fa))


### Documentation

* update async paragraph ([d649f23](https://github.com/KnisterPeter/tsdi/commit/d649f23))


### Features

* add warning for synchronous get with async component ([ef6a916](https://github.com/KnisterPeter/tsdi/commit/ef6a916))
* implement async component initializers ([89a8d81](https://github.com/KnisterPeter/tsdi/commit/89a8d81)), closes [#208](https://github.com/KnisterPeter/tsdi/issues/208)
* Test for async initializers w/o intializers ([bd8304f](https://github.com/KnisterPeter/tsdi/commit/bd8304f))
* throw if dynamic inject async component ([e2438d7](https://github.com/KnisterPeter/tsdi/commit/e2438d7))
* wait for indirect async dependencies to settle ([4d89b43](https://github.com/KnisterPeter/tsdi/commit/4d89b43))


### BREAKING CHANGES

* async dependencies



<a name="0.20.2"></a>
## [0.20.2](https://github.com/KnisterPeter/tsdi/compare/v0.20.1...v0.20.2) (2018-04-20)


### Bug Fixes

* **deps:** update dependency debug to v3.1.0 ([718e955](https://github.com/KnisterPeter/tsdi/commit/718e955))
* do not call destroy method if mock does not implement it ([5bcccc6](https://github.com/KnisterPeter/tsdi/commit/5bcccc6))



<a name="0.20.1"></a>
## [0.20.1](https://github.com/KnisterPeter/tsdi/compare/v0.20.0...v0.20.1) (2018-04-10)


### Bug Fixes

* do not warn on external components and scope warnings ([fbe5140](https://github.com/KnisterPeter/tsdi/commit/fbe5140))



<a name="0.20.0"></a>
# [0.20.0](https://github.com/KnisterPeter/tsdi/compare/v0.19.2...v0.20.0) (2018-04-10)


### Features

* add warning if scopes are probably missued ([33262aa](https://github.com/KnisterPeter/tsdi/commit/33262aa))
* better error reporting on disabled scope ([a33f713](https://github.com/KnisterPeter/tsdi/commit/a33f713))



<a name="0.19.2"></a>
## [0.19.2](https://github.com/KnisterPeter/tsdi/compare/v0.19.1...v0.19.2) (2018-02-07)


### Bug Fixes

* correctly reference types in package.json ([84f9ff1](https://github.com/KnisterPeter/tsdi/commit/84f9ff1))



<a name="0.19.1"></a>
## [0.19.1](https://github.com/KnisterPeter/tsdi/compare/v0.19.0...v0.19.1) (2018-02-07)



<a name="0.19.0"></a>
# [0.19.0](https://github.com/KnisterPeter/tsdi/compare/v0.18.2...v0.19.0) (2018-02-07)


### Features

* add dynamic injections ([9814fb0](https://github.com/KnisterPeter/tsdi/commit/9814fb0))



<a name="0.18.2"></a>
## [0.18.2](https://github.com/KnisterPeter/tsdi/compare/v0.18.1...v0.18.2) (2018-01-08)



<a name="0.18.1"></a>
## [0.18.1](https://github.com/KnisterPeter/tsdi/compare/v0.18.0...v0.18.1) (2017-12-14)


### Bug Fixes

* do not destroy components of other scopes ([c6f34fe](https://github.com/KnisterPeter/tsdi/commit/c6f34fe))



<a name="0.18.0"></a>
# [0.18.0](https://github.com/KnisterPeter/tsdi/compare/v0.17.0...v0.18.0) (2017-11-21)


### Features

* add scopes ([38f20df](https://github.com/KnisterPeter/tsdi/commit/38f20df))



<a name="0.17.0"></a>
# [0.17.0](https://github.com/KnisterPeter/tsdi/compare/v0.16.0...v0.17.0) (2017-11-15)


### Features

* add destroy hook ([5e3f61f](https://github.com/KnisterPeter/tsdi/commit/5e3f61f))



<a name="0.16.0"></a>
# [0.16.0](https://github.com/KnisterPeter/tsdi/compare/v0.15.0...v0.16.0) (2017-11-15)


### Features

* allow injection overrides ([8b89327](https://github.com/KnisterPeter/tsdi/commit/8b89327))



<a name="0.15.0"></a>
# [0.15.0](https://github.com/KnisterPeter/tsdi/compare/v0.14.0...v0.15.0) (2017-10-20)


### Features

* add option to customize automocks ([9e85d44](https://github.com/KnisterPeter/tsdi/commit/9e85d44))



<a name="0.14.0"></a>
# [0.14.0](https://github.com/KnisterPeter/tsdi/compare/v0.13.1...v0.14.0) (2017-09-06)


### Features

* add automock feature ([598b4d6](https://github.com/KnisterPeter/tsdi/commit/598b4d6))



<a name="0.13.1"></a>
## [0.13.1](https://github.com/KnisterPeter/tsdi/compare/v0.13.0...v0.13.1) (2017-09-06)


### Bug Fixes

* access to restricted properties ([9c9f75d](https://github.com/KnisterPeter/tsdi/commit/9c9f75d))
* improve debug message ([e69e2e8](https://github.com/KnisterPeter/tsdi/commit/e69e2e8))



<a name="0.13.0"></a>
# [0.13.0](https://github.com/KnisterPeter/tsdi/compare/v0.12.3...v0.13.0) (2017-09-05)


### Features

* add debug logging ([3fa3e8e](https://github.com/KnisterPeter/tsdi/commit/3fa3e8e))



<a name="0.12.3"></a>
## [0.12.3](https://github.com/KnisterPeter/tsdi/compare/v0.12.2...v0.12.3) (2017-08-31)



<a name="0.12.2"></a>
## [0.12.2](https://github.com/KnisterPeter/tsdi/compare/v0.12.1...v0.12.2) (2017-08-28)


### Bug Fixes

* make sure the prototype chain is kept intact ([9ffb1e2](https://github.com/KnisterPeter/tsdi/commit/9ffb1e2))



<a name="0.12.1"></a>
## [0.12.1](https://github.com/KnisterPeter/tsdi/compare/v0.12.0...v0.12.1) (2017-08-25)


### Bug Fixes

* eager components are always notified about ([8cbaf8c](https://github.com/KnisterPeter/tsdi/commit/8cbaf8c))
* notify about instances on listener subscription ([1441ca6](https://github.com/KnisterPeter/tsdi/commit/1441ca6))



<a name="0.12.0"></a>
# [0.12.0](https://github.com/KnisterPeter/tsdi/compare/v0.11.1...v0.12.0) (2017-08-24)


### Features

* add [@external](https://github.com/external)-test ([c8f7c8d](https://github.com/KnisterPeter/tsdi/commit/c8f7c8d))
* add lifecycle listeners ([6c553bc](https://github.com/KnisterPeter/tsdi/commit/6c553bc))



<a name="0.11.1"></a>
## [0.11.1](https://github.com/KnisterPeter/tsdi/compare/v0.11.0...v0.11.1) (2017-08-09)



<a name="0.11.0"></a>
# [0.11.0](https://github.com/KnisterPeter/tsdi/compare/v0.10.4...v0.11.0) (2017-08-09)


### Features

* add lazy dependency injection ([cb91e0d](https://github.com/KnisterPeter/tsdi/commit/cb91e0d))
* inject lazy by default ([9dc43d4](https://github.com/KnisterPeter/tsdi/commit/9dc43d4))



<a name="0.10.4"></a>
## [0.10.4](https://github.com/KnisterPeter/tsdi/compare/v0.10.3...v0.10.4) (2017-08-07)



<a name="0.10.3"></a>
## [0.10.3](https://github.com/KnisterPeter/tsdi/compare/v0.10.2...v0.10.3) (2017-08-07)


### Bug Fixes

* do not autoname components ([b60f61e](https://github.com/KnisterPeter/tsdi/commit/b60f61e))



<a name="0.10.2"></a>
## [0.10.2](https://github.com/KnisterPeter/tsdi/compare/v0.10.1...v0.10.2) (2017-08-04)


### Bug Fixes

* correct check for requested injectable ([eb797b3](https://github.com/KnisterPeter/tsdi/commit/eb797b3))



<a name="0.10.1"></a>
## [0.10.1](https://github.com/KnisterPeter/tsdi/compare/v0.10.0...v0.10.1) (2017-08-02)



<a name="0.10.0"></a>
# [0.10.0](https://github.com/KnisterPeter/tsdi/compare/v0.9.5...v0.10.0) (2017-08-02)


### Bug Fixes

* register externals on container startup ([a2a600a](https://github.com/KnisterPeter/tsdi/commit/a2a600a))


### Features

* add external components ([f93e9db](https://github.com/KnisterPeter/tsdi/commit/f93e9db))
* Added more info if injection fails ([3fec2f1](https://github.com/KnisterPeter/tsdi/commit/3fec2f1))
* allow constructor injection and initialze method ([ba05742](https://github.com/KnisterPeter/tsdi/commit/ba05742))



<a name="0.9.5"></a>
## [0.9.5](https://github.com/knisterpeter/tsdi/compare/v0.9.4...v0.9.5) (2016-03-04)


### Bug Fixes

* Inject should fallback to type name ([792ee0a](https://github.com/knisterpeter/tsdi/commit/792ee0a))
* Updates to typescript 1.8 ([69a3912](https://github.com/knisterpeter/tsdi/commit/69a3912))



<a name="0.9.4"></a>
## [0.9.4](https://github.com/knisterpeter/tsdi/compare/v0.9.3...v0.9.4) (2016-02-27)


### Bug Fixes

* Fixed error handling and cyclic dependencies ([bdc9095](https://github.com/knisterpeter/tsdi/commit/bdc9095))



<a name="0.9.3"></a>
## [0.9.3](https://github.com/knisterpeter/tsdi/compare/v0.9.2...v0.9.3) (2016-02-27)


### Bug Fixes

* Fixed factory handling ([5aa7853](https://github.com/knisterpeter/tsdi/commit/5aa7853))



<a name="0.9.2"></a>
## [0.9.2](https://github.com/knisterpeter/tsdi/compare/v0.9.1...v0.9.2) (2016-02-26)


### Bug Fixes

* Allow injection of incomplete dependencies ([e6c0d30](https://github.com/knisterpeter/tsdi/commit/e6c0d30))



<a name="0.9.1"></a>
## [0.9.1](https://github.com/knisterpeter/tsdi/compare/v0.9.0...v0.9.1) (2016-02-26)




<a name="0.9.0"></a>
# [0.9.0](https://github.com/knisterpeter/tsdi/compare/v0.8.0...v0.9.0) (2016-02-25)


### Features

* Implemented factories ([ed414d7](https://github.com/knisterpeter/tsdi/commit/ed414d7))



<a name="0.8.0"></a>
# [0.8.0](https://github.com/knisterpeter/tsdi/compare/v0.7.1...v0.8.0) (2016-02-22)


### Features

* Implemented non singleton instances ([4d0873c](https://github.com/knisterpeter/tsdi/commit/4d0873c))



<a name="0.7.1"></a>
## [0.7.1](https://github.com/knisterpeter/tsdi/compare/v0.7.0...v0.7.1) (2016-02-22)


### Bug Fixes

* Added missing parameter options ([cfb7258](https://github.com/knisterpeter/tsdi/commit/cfb7258))



<a name="0.7.0"></a>
# [0.7.0](https://github.com/knisterpeter/tsdi/compare/v0.6.0...v0.7.0) (2016-02-22)


### Features

* Implemented constructor parameter injection ([091de6e](https://github.com/knisterpeter/tsdi/commit/091de6e))



<a name="0.6.0"></a>
# [0.6.0](https://github.com/knisterpeter/tsdi/compare/v0.5.5...v0.6.0) (2016-02-21)


### Features

* Added container instance as injectable ([cef36d6](https://github.com/knisterpeter/tsdi/commit/cef36d6))



<a name="0.5.5"></a>
## [0.5.5](https://github.com/knisterpeter/tsdi/compare/v0.5.4...v0.5.5) (2016-02-19)


### Bug Fixes

* Fixed properties with falsy values ([869e3e3](https://github.com/knisterpeter/tsdi/commit/869e3e3))



<a name="0.5.4"></a>
## [0.5.4](https://github.com/knisterpeter/tsdi/compare/v0.5.3...v0.5.4) (2016-02-17)


### Bug Fixes

* Finished typescript packaging for npm ([e986879](https://github.com/knisterpeter/tsdi/commit/e986879))



<a name="0.5.3"></a>
## [0.5.3](https://github.com/knisterpeter/tsdi/compare/v0.5.2...v0.5.3) (2016-02-16)


### Bug Fixes

* Another fix for typings packaging ([6eb439a](https://github.com/knisterpeter/tsdi/commit/6eb439a))



<a name="0.5.2"></a>
## [0.5.2](https://github.com/knisterpeter/tsdi/compare/v0.5.1...v0.5.2) (2016-02-16)




<a name="0.5.1"></a>
## [0.5.1](https://github.com/knisterpeter/tsdi/compare/v0.5.0...v0.5.1) (2016-02-16)




<a name="0.5.0"></a>
# [0.5.0](https://github.com/knisterpeter/tsdi/compare/v0.4.0...v0.5.0) (2016-01-18)


### Features

* Do not duplicate components with same name ([5eeb95a](https://github.com/knisterpeter/tsdi/commit/5eeb95a))
* Implemented property value injection ([07bf213](https://github.com/knisterpeter/tsdi/commit/07bf213))



<a name="0.4.0"></a>
# [0.4.0](https://github.com/knisterpeter/tsdi/compare/v0.3.0...v0.4.0) (2016-01-16)


### Features

* Add typesafety for container.get ([9d9103d](https://github.com/knisterpeter/tsdi/commit/9d9103d))
* Implemented interface based/name based injection ([36e0226](https://github.com/knisterpeter/tsdi/commit/36e0226))



<a name="0.3.0"></a>
# [0.3.0](https://github.com/knisterpeter/tsdi/compare/v0.2.0...v0.3.0) (2016-01-11)


### Features

* Added component scanner for auto registration of components ([a8915e2](https://github.com/knisterpeter/tsdi/commit/a8915e2))



<a name="0.2.0"></a>
# [0.2.0](https://github.com/knisterpeter/tsdi/compare/v0.1.1...v0.2.0) (2016-01-10)


### Features

* Use decorator factories for future extensability ([bbe92aa](https://github.com/knisterpeter/tsdi/commit/bbe92aa))



<a name="0.1.1"></a>
## [0.1.1](https://github.com/knisterpeter/tsdi/compare/c71a2ee...v0.1.1) (2016-01-09)


### Features

* Initial release ([c71a2ee](https://github.com/knisterpeter/tsdi/commit/c71a2ee))
