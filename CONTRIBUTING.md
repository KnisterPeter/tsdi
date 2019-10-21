# Contributing

Contributions are always welcome, no matter how large or small. Before
contributing, please read the
[code of conduct](https://github.com/babel/babel/blob/master/CODE_OF_CONDUCT.md).

## Developing

TSDI is built for Node 10 and up but we develop using Node 12 and pnpm. You can check this with `node -v`.

Make sure that pnpm is installed with version >= `4.0.0`.
Installation instructions can be found here: https://github.com/pnpm/pnpm#install.

### Setup

```sh
$ git clone https://github.com/KnisterPeter/tsdi
$ cd tsdi
$ pnpm install
```

Then you can either run:

```sh
$ pnpm run build
```

to build TSDI **once** or:

```sh
$ pnpm run build:watch
```

to have TSDI build itself and incrementally build files on change.

### Running linting/tests

You can run lint via:

```sh
$ pnpm run linter
```

You can run tests via:

```sh
$ pnpm run test
```

or enable debug output via:

```sh
$ DEBUG='tsdi' pnpm run test
```
