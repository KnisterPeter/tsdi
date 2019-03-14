// tslint:disable-next-line:no-implicit-dependencies
import execa = require('execa');

jest.setTimeout(20000);
test('Compiler should respect out-dir setting and write paths relative to folder', async () => {
  const result = await execa(
    process.argv[0],
    [
      '../../../dist/compiler/cli.js',
      '--project',
      './tsconfig.json',
      '--out-dir',
      './gen',
      '--std-out'
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
  constructor() {
    super();
    this._tsdi = new TSDI(C1_Container);
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
