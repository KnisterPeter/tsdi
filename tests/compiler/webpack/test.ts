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

jest.setTimeout(40000);

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

test('TSDICompilerPlugin should run compiler right before compilation starts', async done => {
  const compiler = webpack(config);
  compiler.run((err, stats) => {
    if (err || stats.hasErrors()) {
      fail(err || stats.compilation.errors[0]);
    }

    expect(existsSync(containerImplFile)).toBeTruthy();

    done();
  });
});

test('TSDICompilerPlugin should rerun compiler in watch mode', async done => {
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

test('TSDICompilerPlugin should run without outputDir', async done => {
  const containerImplFile = join(__dirname, 'container-impl.ts');
  if (existsSync(containerImplFile)) {
    unlinkSync(containerImplFile);
  }

  const compiler = webpack({
    ...config,
    plugins: [
      new TSDICompilerPlugin({
        tsdiModule: '../../../..'
      })
    ]
  });
  compiler.run(() => {
    expect(existsSync(containerImplFile)).toBeTruthy();
    unlinkSync(containerImplFile);

    done();
  });
});
