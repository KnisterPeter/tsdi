import { container, managed } from '../../..';

@container
export abstract class Container1 {}

@container
export abstract class Container2 {}

@managed
export class Test {}
