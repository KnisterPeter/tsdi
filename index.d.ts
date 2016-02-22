export declare type Constructable<T> = {
    new (...args: any[]): T;
};
export interface IComponentOptions {
    name?: string;
    singleton?: boolean;
}
export interface IInjectOptions {
    name?: string;
}
export declare class TSDI {
    private components;
    private instances;
    private listener;
    private properties;
    constructor();
    addProperty(key: string, value: any): void;
    close(): void;
    enableComponentScanner(): void;
    private registerComponent(componentMetadata);
    register(component: Constructable<any>, name?: string): void;
    private getComponentMetadataIndex(component, name?);
    private throwComponentNotFoundError(component, name);
    private getConstructorParameters(componentMetadata);
    private isSingleton(componentMetadata);
    get<T>(component: Constructable<T>, hint?: string): T;
}
export declare function Component(options?: IComponentOptions): ClassDecorator;
export declare function Inject(options?: IInjectOptions): any;
export declare function Initialize(): MethodDecorator;
