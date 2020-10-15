# [0.25.0](https://github.com/KnisterPeter/tsdi/compare/v0.24.1...v0.25.0) (2020-10-15)


### Features

* add onReady lifecycle ([#1122](https://github.com/KnisterPeter/tsdi/issues/1122)) ([f884ba4](https://github.com/KnisterPeter/tsdi/commit/f884ba4e8cf1678b9e36411584cdbf5890b2b1d7)), closes [#1121](https://github.com/KnisterPeter/tsdi/issues/1121)
* add promise based get method for async components ([#1124](https://github.com/KnisterPeter/tsdi/issues/1124)) ([72d0a67](https://github.com/KnisterPeter/tsdi/commit/72d0a67689c782ec3ce96851425c553554c37af6))
* allow to remove lifecycle listeners ([#1123](https://github.com/KnisterPeter/tsdi/issues/1123)) ([71cf873](https://github.com/KnisterPeter/tsdi/commit/71cf8733de90b1040ac9efba98b91e47fdcda546))



## [0.24.1](https://github.com/KnisterPeter/tsdi/compare/v0.24.0...v0.24.1) (2020-10-10)



# [0.24.0](https://github.com/KnisterPeter/tsdi/compare/v0.23.0...v0.24.0) (2020-10-10)


### Features

* add container hierarchies ([#1115](https://github.com/KnisterPeter/tsdi/issues/1115)) ([6096b63](https://github.com/KnisterPeter/tsdi/commit/6096b63bb984311b4a5bf65501d677095fdb30b9)), closes [#271](https://github.com/KnisterPeter/tsdi/issues/271)
* allow scoped selected container configuration ([520d6be](https://github.com/KnisterPeter/tsdi/commit/520d6bebd93c9d5541b10086f2b45ab8a7a3af11))
* define the external constructor name ([#1114](https://github.com/KnisterPeter/tsdi/issues/1114)) ([bbdcad0](https://github.com/KnisterPeter/tsdi/commit/bbdcad0f801a17345f1148b783aa34d6c0be60b2)), closes [#390](https://github.com/KnisterPeter/tsdi/issues/390)



# [0.23.0](https://github.com/KnisterPeter/tsdi/compare/v0.22.0...v0.23.0) (2020-09-15)


### Bug Fixes

* add missing return ([aa63bfe](https://github.com/KnisterPeter/tsdi/commit/aa63bfe45d8e0c4beeb4b1c2bcc23803d291f66c))
* handle deeper async structures ([8be0d49](https://github.com/KnisterPeter/tsdi/commit/8be0d498a6724fe8dc3823eff8c4807d3cc97f3a))
* mark components as async during registration phase ([ebf95f6](https://github.com/KnisterPeter/tsdi/commit/ebf95f62253604d792cdec3e28e65e486aa75972))
* remove mergeStrategy ([#996](https://github.com/KnisterPeter/tsdi/issues/996)) ([7309226](https://github.com/KnisterPeter/tsdi/commit/730922695435607cba165f4a8063e2aeff0099db))


### Features

* add lazy factory injections ([dbe18c5](https://github.com/KnisterPeter/tsdi/commit/dbe18c565834d5d5b2d7e62aef09a692bb3d5b4c))
* externals could be lazy initialized ([b5e581b](https://github.com/KnisterPeter/tsdi/commit/b5e581b85e3af13dac1248224ac691aa1afe7883))
* implement async component initializers ([aaaed6e](https://github.com/KnisterPeter/tsdi/commit/aaaed6e456d56a54f7868e98ca2e3ff2deb57867)), closes [#208](https://github.com/KnisterPeter/tsdi/issues/208)
* Test for async initializers w/o intializers ([fe21685](https://github.com/KnisterPeter/tsdi/commit/fe21685ae5b0270d38e6cbab8ae5645e59e54674))
* throw if dynamic inject async component ([9d7cd6e](https://github.com/KnisterPeter/tsdi/commit/9d7cd6e7739aaf118f87a3f80f854ddc527c310a))
* wait for indirect async dependencies to settle ([c28a07f](https://github.com/KnisterPeter/tsdi/commit/c28a07f57e7dc1181b82102016e8afe1c93faf72))



# [0.22.0](https://github.com/KnisterPeter/tsdi/compare/v0.21.0...v0.22.0) (2019-12-20)


### Bug Fixes

* move cypress to dev dependencies ([a298fba](https://github.com/KnisterPeter/tsdi/commit/a298fba61e33e9daf72f468aee0a097a513056b2))
* remove cz-conventional-changelog ([0e75308](https://github.com/KnisterPeter/tsdi/commit/0e753084077b4bb1c96c8e313374fa653d85bb6e))


### Features

* add cypress github integration ([553998d](https://github.com/KnisterPeter/tsdi/commit/553998d8c5d42f2ac6b1c97c3b9d0aba5613580d))
* add umd test and browser tests ([ef6495e](https://github.com/KnisterPeter/tsdi/commit/ef6495e08a1a710f5817b300845156453b0a1317))



<a name="0.21.0"></a>
# [0.21.0](https://github.com/KnisterPeter/tsdi/compare/v0.20.3...v0.21.0) (2019-10-13)


### Features

* bundle with microbundle ([1a9bd4e](https://github.com/KnisterPeter/tsdi/commit/1a9bd4e))



<a name="0.20.3"></a>
## [0.20.3](https://github.com/KnisterPeter/tsdi/compare/v0.20.2...v0.20.3) (2018-06-04)


### Bug Fixes

* update typescript definition to conform to 2.9 ([bb01b87](https://github.com/KnisterPeter/tsdi/commit/bb01b87))



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
