import { Component } from '../lib/decorators';

@Component
export class Dependency {

  public echo(input: string): string {
    return input;
  }

}
