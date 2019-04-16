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

test('TSDICompilerPlugin should allow relative output path', done => {
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
        outputDir: 'src',
        tsdiModule: '../../../..',
        verbose: Level.none
      })
    ]
  };
  const compiler = webpack(config);
  compiler.run(() => {
    expect(existsSync(containerImplFile)).toBeTruthy();

    done();
  });
});
