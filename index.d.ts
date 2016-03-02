import 'reflect-metadata';
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
export interface IFactoryOptions {
    name?: string;
    singleton?: boolean;
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
    private getConstructorParameters(metadata);
    private isSingleton(metadata);
    private getOrCreate<T>(metadata, idx);
    get<T>(hint: string): T;
    get<T>(component: Constructable<T>): T;
    get<T>(component: Constructable<T>, hint: string): T;
}
export declare function Component(optionsOrString?: IComponentOptions | string): ClassDecorator;
export declare function Inject(optionsOrString?: IInjectOptions | string): PropertyDecorator & ParameterDecorator;
export declare function Initialize(): MethodDecorator;
export declare function Factory(options?: IFactoryOptions): MethodDecorator;
