import { Component, Inject, Initialize } from '../lib/decorators';
import { Dependency } from './dependency';

@Component()
export class User {

  @Inject()
  private dependency: Dependency;

  private initMessage: string;

  public getDep(): Dependency {
    return this.dependency;
  }

  @Initialize()
  public init(): void {
    this.initMessage = 'init';
  }

  public initResult(): string {
    return this.initMessage;
  }

  public method(): string {
    return this.dependency.echo('hello');
  }

}
