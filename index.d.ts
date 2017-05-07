import 'reflect-metadata';
export declare type Constructable<T> = {
    new (...args: any[]): T;
};
export declare type IComponentOptions = ComponentOptions;
export interface ComponentOptions {
    name?: string;
    singleton?: boolean;
}
export declare type IInjectOptions = InjectOptions;
export interface InjectOptions {
    name?: string;
}
export declare type IFactoryOptions = FactoryOptions;
export interface FactoryOptions {
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
    private isComponentMetadataIndexFromComponentOrFactory(component, metadata);
    private throwComponentNotFoundError(component, name);
    private getConstructorParameters(metadata);
    private isSingleton(metadata);
    private getOrCreate<T>(metadata, idx);
    private injectIntoInstance(instance, componentMetadata);
    private getComponentDependency(inject);
    get<T>(componentOrHint: string | Constructable<T>): T;
    get<T>(component: Constructable<T>, hint: string): T;
}
export declare function Component(optionsOrString?: IComponentOptions | string): ClassDecorator;
export declare function Inject(optionsOrString?: IInjectOptions | string): PropertyDecorator & ParameterDecorator;
export declare function Initialize(): MethodDecorator;
export declare function Factory(options?: IFactoryOptions): MethodDecorator;
