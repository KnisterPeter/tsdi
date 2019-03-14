#!/usr/bin/env node

import { Command, flags } from '@oclif/command';
import figlet from 'figlet';
import { writeFileSync } from 'fs';
import kebabCase from 'lodash.kebabcase';
import { join } from 'path';
import { Compiler } from '.';

class CompilerCommand extends Command {
  public static description = 'The TSDI compiler cli';

  public static flags = {
    project: flags.string({
      name: 'p',
      description: "Path to a project's tsconfig.json",
      default: 'tsconfig.json',
      required: true
    }),
    'out-dir': flags.string({
      name: 'o',
      description: 'Output folder to write containers to',
      default: '.',
      required: true
    }),
    stdout: flags.boolean({
      description:
        'Print containers to stdout instead of write them to the filesystem',
      default: false,
      required: false
    })
  };

  public async run(): Promise<any> {
    const { flags } = this.parse(CompilerCommand);

    new Compiler(flags.project).getContainers().forEach(container => {
      const code = container.generate(flags['out-dir']);
      if (flags.stdout) {
        process.stdout.write(code);
      } else {
        const fileName = kebabCase(container.implName).replace(/^-/, '');
        const fullFilePath = join(flags['out-dir'], fileName + '.ts');
        writeFileSync(fullFilePath, code);
        console.error(
          `Written container ${container.name} (${
            container.implName
          }) to ${fullFilePath}`
        );
      }
    });
  }
}

console.error(figlet.textSync('TSDI', { horizontalLayout: 'full' }));
// tslint:disable-next-line:no-var-requires no-implicit-dependencies
(CompilerCommand.run() as Promise<any>).catch(require('@oclif/errors/handle'));
