// @ts-check
import builtinModules from 'builtin-modules';
import * as rollup from 'rollup';
import analyze from 'rollup-plugin-analyzer';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

/**
 * @type rollup.RollupOptions
 */
const config = {
  input: 'dist/esm/index.js',
  output: {
    file: 'dist/umd/tsdi.js',
    format: 'umd',
    name: 'tsdi',
    sourcemap: true
  },
  // @ts-ignore
  external: builtinModules,
  // @ts-ignore
  plugins: [nodeResolve(), commonjs(), terser(), analyze()]
};

/**
 * @type rollup.RollupOptions
 */
const configLegacy = {
  input: 'dist/esm/legacy.js',
  output: {
    file: 'dist/umd/tsdi.legacy.js',
    format: 'umd',
    name: 'tsdi',
    sourcemap: true
  },
  // @ts-ignore
  external: builtinModules,
  // @ts-ignore
  plugins: [nodeResolve(), commonjs(), terser(), analyze()]
};

export default [config, configLegacy];
