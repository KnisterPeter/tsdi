module.exports = function (wallaby) {
  return {
    trace: true,
    files: ['lib/**', '!lib/__tests__/*-test.ts'],
    tests: ['lib/__tests__/*-test.ts'],
    testFramework: 'mocha',
    env: {
      type: 'node',
    },
    compilers: {
      '**/*.ts?(x)': wallaby.compilers.typeScript({
        module: 'commonjs',
      }),
    },
  };
};
