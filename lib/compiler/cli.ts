import { writeFileSync } from 'fs';
import { Compiler, CompilerHost } from './compiler';

const root = process.argv.length > 1 ? process.argv[2] : undefined;

const host: CompilerHost = {
  writeFile: (filename, code) => writeFileSync(filename, code)
};

Compiler.create(host, root)
  .run()
  .then(() => {
    process.exit(0);
  })
  .catch(e => {
    setImmediate(() => {
      throw e;
    });
  });
