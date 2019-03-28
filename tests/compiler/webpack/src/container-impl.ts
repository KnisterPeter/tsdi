// tslint:disable
import { TSDI } from '../../../..';
import { Container as C1_Container, Entity as C2_Entity } from './container';
export class ContainerImpl extends C1_Container {
  private readonly _tsdi: TSDI;
  constructor() {
    super();
    this._tsdi = new TSDI(C1_Container);
    this._tsdi.configure(C2_Entity, {
      propertyDependencies: []
    });
  }
  public get entity(): C2_Entity {
    return this._tsdi.get(C2_Entity);
  }
  public close(): void {
    this._tsdi.close();
  }
}
