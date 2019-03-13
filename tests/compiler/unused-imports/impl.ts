import { managed } from '../../..';
import { Test } from './api';

export class TestImpl implements Test {
  public name = TestImpl.name;
}

@managed
export class User {
  constructor(public test: Test) {}
}
