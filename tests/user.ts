import { Component, Inject } from '../lib/decorators';
import { Dependency } from './dependency';

@Component
export class User {

  @Inject
  private dependency: Dependency;

  public getDep(): Dependency {
    return this.dependency;
  }

  public method(): string {
    return this.dependency.echo('hello');
  }

}
