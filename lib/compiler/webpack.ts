import { writeFileSync } from 'fs';
import kebabCase from 'lodash.kebabcase';
import { isAbsolute, join } from 'path';
// tslint:disable-next-line:no-implicit-dependencies
import webpack from 'webpack';
import { Compiler } from '.';

export interface Config {
  tsconfig: string;
  outputDir: string;
  tsdiModule: string;
}

export default class TSDICompilerPlugin {
  constructor(private readonly config: Partial<Config> = {}) {}

  private getOutputDir(compiler: webpack.Compiler): string {
    if (this.config.outputDir) {
      return isAbsolute(this.config.outputDir)
        ? this.config.outputDir
        : join(compiler.options.context || __dirname, this.config.outputDir);
    }
    return compiler.options.context || __dirname;
  }

  public apply(compiler: webpack.Compiler): void {
    const config: Config = {
      tsconfig:
        this.config.tsconfig ||
        join(compiler.options.context || __dirname, 'tsconfig.json'),
      outputDir: this.getOutputDir(compiler),
      tsdiModule: this.config.tsdiModule || 'tsdi'
    };

    compiler.hooks.thisCompilation.tap(TSDICompilerPlugin.name, () => {
      // generate containers
      const containerFiles = new Compiler(config.tsconfig)
        .getContainers()
        .map(container => {
          const code = container.generate(config.outputDir);
          const fullFilePath = join(
            config.outputDir,
            `${kebabCase(container.implName).replace(/^-/, '')}.ts`
          );
          writeFileSync(
            fullFilePath,
            code.replace(
              /import { TSDI } from (["'])tsdi["'];/,
              `import { TSDI } from $1${config.tsdiModule}$1;`
            )
          );
          return fullFilePath;
        });

      // add container files to watch ignore list
      const paths: string[] | undefined = (
        (compiler as any) || { watchFileSystem: {} }
      ).watchFileSystem.paths;
      if (paths) {
        containerFiles.forEach(file => {
          if (paths && !paths.includes(file)) {
            paths.push(file);
          }
        });
      } else {
        new webpack.WatchIgnorePlugin(containerFiles).apply(compiler);
        compiler.hooks.afterEnvironment.call();
      }
    });
  }
}

module.exports = TSDICompilerPlugin;
