import { Component } from '../lib/';

@Component()
export class Dependency {

  public echo(input: string): string {
    return input;
  }

}
