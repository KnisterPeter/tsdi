import * as ts from 'typescript';
import { Compiler } from './compiler';

const root = process.argv.length > 1 ? process.argv[2] : undefined;

new Compiler(ts.sys, root)
  .run()
  .then(() => {
    process.exit(0);
  })
  .catch(e => {
    setImmediate(() => {
      throw e;
    });
  });
