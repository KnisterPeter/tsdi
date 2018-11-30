// @ts-check
import builtinModules from 'builtin-modules';
import * as rollup from 'rollup';
import commonjs from 'rollup-plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
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
  plugins: [
    nodeResolve(),
    commonjs(),
    // @ts-ignore
    builtins(),
    // @ts-ignore
    globals(),
    terser()
  ]
};
export default config;
