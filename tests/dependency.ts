import { Component } from '../lib/legacy';

@Component()
export class Dependency {
  public echo(input: string): string {
    return input;
  }
}
