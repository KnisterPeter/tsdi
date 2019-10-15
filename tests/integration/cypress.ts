// tslint:disable-next-line: no-implicit-dependencies
import { exec } from 'shelljs';

try {
  run('npx http-server -p 9876 .', true);
  run('yarn wait-on http://localhost:9876/dist/index.js');

  run(`yarn cypress ${process.argv[2]}`);
} finally {
  run('pkill --full "npx http-server -p 9876"');
}

function run(command: string, async = false): void {
  const result = exec(command, { async });
  if ('code' in result && result.code !== 0) {
    throw new Error(
      `Failed to run command '${command}'. Exited with ${result.code}`
    );
  }
}
