# Contributing

Contributions are always welcome, no matter how large or small. Before
contributing, please read the
[code of conduct](https://github.com/babel/babel/blob/master/CODE_OF_CONDUCT.md).

## Developing

TSDI is built for Node 6 and up but we develop using Node 10 and yarn. You can check this with `node -v`.

Make sure that Yarn is installed with version >= `1.6.0`.
Installation instructions can be found here: https://yarnpkg.com/en/docs/install.

### Setup

```sh
$ git clone https://github.com/KnisterPeter/tsdi
$ cd tsdi
$ yarn
```

Then you can either run:

```sh
$ yarn build
```

to build TSDI **once** or:

```sh
$ yarn build:watch
```

to have TSDI build itself and incrementally build files on change.

### Running linting/tests

You can run lint via:

```sh
$ yarn linter
```

You can run tests via:

```sh
$ yarn test
```

or enable debug output via:

```sh
$ DEBUG='tsdi' yarn test
```
