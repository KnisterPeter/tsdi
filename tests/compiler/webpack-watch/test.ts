import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import webpack from 'webpack';
import { Level } from '../../../lib/compiler/logger';
import TSDICompilerPlugin from '../../../lib/compiler/webpack';

const containerImplFile = join(__dirname, 'src', 'container-impl.ts');
const outputFile = join(__dirname, 'output.js');

jest.setTimeout(40000);

beforeEach(() => {
  if (existsSync(containerImplFile)) {
    unlinkSync(containerImplFile);
  }
});

afterEach(() => {
  if (existsSync(outputFile)) {
    unlinkSync(outputFile);
  }
  if (existsSync(containerImplFile)) {
    unlinkSync(containerImplFile);
  }
});

test('TSDICompilerPlugin should rerun compiler in watch mode', async done => {
  const config: webpack.Configuration = {
    context: __dirname,
    mode: 'production',
    entry: './src/index.ts',
    output: {
      path: __dirname,
      filename: 'output.js'
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js']
    },
    plugins: [
      new TSDICompilerPlugin({
        outputDir: join(__dirname, 'src'),
        tsdiModule: '../../../..',
        verbose: Level.none
      })
    ]
  };
  let runs = 0;

  const compiler = webpack(config);
  let watcher: webpack.Compiler.Watching = undefined as any;
  await new Promise(async (resolve2, reject) => {
    // start compiler
    await new Promise(resolve1 => {
      watcher = compiler.watch({}, (err, stats) => {
        runs++;
        if (err || stats.hasErrors()) {
          reject(err || stats.compilation.errors[0]);
          return;
        }
        if (runs === 1) {
          resolve1();
        } else if (runs === 2) {
          resolve2();
        } else {
          reject();
        }
      });
    });

    // after first build => invalidate
    watcher.invalidate();
  });

  // after second build => close and assert
  watcher.close(() => {
    expect(existsSync(containerImplFile)).toBeTruthy();
    expect(runs).toBe(2);

    done();
  });
});
