import { Component } from '../dist/';

@Component()
export class Dependency {
  public echo(input: string): string {
    return input;
  }
}
