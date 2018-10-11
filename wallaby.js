module.exports = function(wallaby) {
  return {
    files: [
      'tsconfig.json',
      'lib/**/*.ts',
      'tests/**/*.ts',
      '!tests/**/*.test.ts',
      // tslib is required for testing module resolution
      {
        pattern: 'node_modules/tslib/**',
        instrument: false,
        load: false,
        ignore: false
      }
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
