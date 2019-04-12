import { writeFileSync } from 'fs';
import kebabCase from 'lodash.kebabcase';
import { isAbsolute, join } from 'path';
import webpack from 'webpack';
import { Compiler } from '.';
import { isDefined } from './util';

export interface Config {
  tsconfig: string;
  outputDir: string;
  tsdiModule: string;
}

export default class TSDICompilerPlugin {
  constructor(private readonly config: Partial<Config> = {}) {}

  private getOutputDir(context: string): string {
    if (this.config.outputDir) {
      return isAbsolute(this.config.outputDir)
        ? this.config.outputDir
        : join(context, this.config.outputDir);
    }
    return context;
  }

  public apply(compiler: webpack.Compiler): void {
    const config: Config = {
      tsconfig:
        this.config.tsconfig ||
        join(compiler.options.context!, 'tsconfig.json'),
      outputDir: this.getOutputDir(compiler.options.context!),
      tsdiModule: this.config.tsdiModule || 'tsdi'
    };

    compiler.hooks.thisCompilation.tap(TSDICompilerPlugin.name, compilation => {
      // generate containers
      const containerFiles = new Compiler(config.tsconfig)
        .getContainers()
        .map(container => {
          try {
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
          } catch (e) {
            compilation.errors.push(e);
            return undefined;
          }
        })
        .filter(isDefined);

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
      } else if (containerFiles.length > 0) {
        new webpack.WatchIgnorePlugin(containerFiles).apply(compiler);
        compiler.hooks.afterEnvironment.call();
      }
    });
  }
}

module.exports = TSDICompilerPlugin;
