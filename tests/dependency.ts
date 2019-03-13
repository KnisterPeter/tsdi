import { Component } from '..';

@Component()
export class Dependency {
  public echo(input: string): string {
    return input;
  }
}
