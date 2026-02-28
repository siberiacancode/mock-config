import type { PlainObject } from '../../../../types';
type TokenNestedOption = Record<string, boolean>;
type TokenOptions = Record<string, boolean | TokenNestedOption>;
export declare const filterTokens: (tokens: PlainObject, options: TokenOptions) => PlainObject;
export {};
