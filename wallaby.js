module.exports = function (wallaby) {
  return {
    files: [
      'lib/**/*.ts',
      'tests/**/*.ts',
      '!tests/**/*-test.ts'
    ],
    tests: [
      'tests/**/*-test.ts'
    ],
    testFramework: 'mocha',
    env: {
      type: 'node'
    },
    compilers: {
      '**/*.ts': wallaby.compilers.typeScript({
        typescript: require('typescript'),
        module: 1, // commonjs
        emitDecoratorMetadata: true
      })
    }
  };
};
