import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import webpack from 'webpack';
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

test('TSDICompilerPlugin should keep watch ignore list', done => {
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
        tsdiModule: '../../../..'
      })
    ]
  };

  const compiler = webpack({
    ...config,
    plugins: [
      new webpack.WatchIgnorePlugin(['/tmp']),
      new TSDICompilerPlugin({
        outputDir: join(__dirname, 'src'),
        tsdiModule: '../../../..'
      })
    ]
  });
  compiler.run(() => {
    expect((compiler as any).watchFileSystem.paths).toEqual(
      expect.arrayContaining([
        '/tmp',
        join(__dirname, 'src', 'container-impl.ts')
      ])
    );

    done();
  });
});
