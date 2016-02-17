export declare type Constructable<T> = {
    new (): T;
};
export interface IComponentOptions {
    name?: string;
}
export interface IInjectOptions {
    name?: string;
}
export declare class TSDI {
    private components;
    private instances;
    private listener;
    private properties;
    addProperty(key: string, value: any): void;
    close(): void;
    enableComponentScanner(): void;
    private registerComponent(componentMetadata);
    register(component: Constructable<any>, name?: string): void;
    private getComponentMetadataIndex(component, name?);
    get<T>(component: Constructable<T>, hint?: string): T;
}
export declare function Component(options?: IComponentOptions): ClassDecorator;
export declare function Inject(options?: IInjectOptions): PropertyDecorator;
export declare function Initialize(): MethodDecorator;
