module.exports = function(wallaby) {
  return {
    files: [
      'tsconfig.json',
      'lib/**/*.ts',
      'tests/**/*.ts',
      '!tests/**/*.test.ts'
    ],
    tests: ['tests/**/*.test.ts'],
    testFramework: 'jest',
    env: {
      type: 'node'
    },
    compilers: {
      '**/*.ts': wallaby.compilers.typeScript({
        module: 'commonjs',
        emitDecoratorMetadata: true
      })
    }
  };
};
