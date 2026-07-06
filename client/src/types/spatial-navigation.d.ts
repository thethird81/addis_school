declare module 'spatial-navigation' {
    export default class SpatialNavigation {
        static init(): void;
        static add(config: { selector: string }): void;
    }
}