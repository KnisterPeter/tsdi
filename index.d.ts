declare module 'tsdi' {

  export type Constructable<T> = { new(): T; };

  export interface IComponentOptions {
    name?: string;
  }

  export interface IInjectOptions {
    name?: string;
  }

  export class TSDI {
    public addProperty(key: string, value: any): void;
    public close(): void;
    public enableComponentScanner(): void;
    public register(component: Constructable<any>, name?: string): void;
    public get<T>(component: Constructable<T>, hint?: string): T;

  }

  export function Component(options?: IComponentOptions): ClassDecorator;
  export function Inject(options?: IInjectOptions): PropertyDecorator;
  export function Initialize(): MethodDecorator;

}
