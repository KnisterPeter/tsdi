// tslint:disable-next-line:no-implicit-dependencies
import { sync as execa } from 'execa';

jest.setTimeout(20000);

test('Compiler should respect out-dir setting and write paths relative to folder', () => {
  const result = execa(
    process.argv[0],
    [
      '../../../dist/compiler/cli.js',
      '--project',
      './tsconfig.json',
      '--out-dir',
      './gen',
      '--stdout'
    ],
    { cwd: __dirname }
  );

  expect(result.stdout).toBe(`// tslint:disable
import { TSDI } from 'tsdi';
import {
  Container as C1_Container,
  Dependency as C3_Dependency,
  Test as C2_Test
} from '../container';
export class ContainerImpl extends C1_Container {
  private readonly _tsdi: TSDI;
  constructor(impl = TSDI) {
    super();
    this._tsdi = new impl(C1_Container);
    this._tsdi.configure(C2_Test, {
      constructorDependencies: [C3_Dependency],
      propertyDependencies: []
    });
    this._tsdi.configure(C3_Dependency, {
      propertyDependencies: []
    });
  }
  public get test(): C2_Test {
    return this._tsdi.get(C2_Test);
  }
  public close(): void {
    this._tsdi.close();
  }
}`);
});
