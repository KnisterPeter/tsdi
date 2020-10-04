// tslint:disable: no-implicit-dependencies
import fkill from 'fkill';
import getPort from 'get-port';
import { exec } from 'shelljs';

const [, , command, ...args] = process.argv;

// tslint:disable-next-line: space-before-function-paren
(async () => {
  const port = await getPort({ port: 9876 });
  try {
    run(`npx http-server -p ${port} .`, true);
    run(`yarn wait-on http://localhost:${port}/dist/index.js`);

    run(
      `npx cross-env CYPRESS_baseUrl=http://localhost:${port} yarn cypress ${command} ${args.join(
        ' '
      )}`
    );
  } finally {
    try {
      await fkill(`:${port}`);
    } catch (e) {
      console.warn(e);
    }
  }
})().catch((e) => {
  setImmediate(() => {
    throw e;
  });
});

function run(command: string, async = false): void {
  const result = exec(command, { async });
  if ('code' in result && result.code !== 0) {
    throw new Error(
      `Failed to run command '${command}'. Exited with ${result.code}`
    );
  }
}
