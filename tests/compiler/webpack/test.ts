import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
// tslint:disable-next-line:no-implicit-dependencies
import webpack from 'webpack';
import TSDICompilerPlugin from '../../../lib/compiler/webpack';

const containerImplFile = join(__dirname, 'src', 'container-impl.ts');

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

jest.setTimeout(20000);

beforeEach(() => {
  if (existsSync(containerImplFile)) {
    unlinkSync(containerImplFile);
  }
});

afterEach(() => {
  const outputFile = join(__dirname, 'output.js');
  if (existsSync(outputFile)) {
    unlinkSync(outputFile);
  }
});

test('TSDICompilerPlugin should run compiler right before compilation starts', done => {
  const compiler = webpack(config);
  compiler.run((err, stats) => {
    if (err || stats.hasErrors()) {
      fail(err || stats.compilation.errors[0]);
    }

    expect(existsSync(containerImplFile)).toBeTruthy();

    done();
  });
});

test('TSDICompilerPlugin should rerun compiler in watch mode', done => {
  let error: Error | undefined;
  let runs = 0;

  const compiler = webpack(config);
  const watcher = compiler.watch({}, (err, stats) => {
    runs++;
    if (err || stats.hasErrors()) {
      error = err || stats.compilation.errors[0];
      return;
    }
  });
  setTimeout(() => {
    watcher.invalidate();

    setTimeout(() => {
      watcher.close(() => {
        expect(error).toBeUndefined();
        expect(existsSync(containerImplFile)).toBeTruthy();
        expect(runs).toBe(2);

        done();
      });
    }, 5000);
  }, 5000);
});

test('TSDICompilerPlugin should keep watch ignore list', done => {
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

test('TSDICompilerPlugin should allow relative output path', done => {
  const compiler = webpack({
    ...config,
    plugins: [
      new TSDICompilerPlugin({
        outputDir: 'src',
        tsdiModule: '../../../..'
      })
    ]
  });
  compiler.run(() => {
    expect(existsSync(containerImplFile)).toBeTruthy();

    done();
  });
});
