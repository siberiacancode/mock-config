import type { PlainObject } from '../types';
declare const DATA_RESOLVING_PROPERTIES: readonly ["data", "file", "queue"];
export declare const isOnlyRequestedDataResolvingPropertyExists: (object: PlainObject, requestedDataResolvingProperty: (typeof DATA_RESOLVING_PROPERTIES)[number]) => boolean;
export {};
