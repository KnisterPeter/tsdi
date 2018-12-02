// @ts-check
import builtinModules from 'builtin-modules';
import * as rollup from 'rollup';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

/**
 * @type rollup.RollupFileOptions
 */
const config = {
  input: 'dist/esm/lib/index.js',
  output: {
    file: 'dist/umd/tsdi.js',
    format: 'umd',
    name: 'tsdi',
    sourcemap: true
  },
  // @ts-ignore
  external: builtinModules,
  plugins: [nodeResolve(), commonjs(), terser()]
};
export default config;
