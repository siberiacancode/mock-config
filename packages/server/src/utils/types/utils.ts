import type { PlainObject } from './values';

export type ValueOf<T extends Array<any> | PlainObject> =
  T extends Array<any> ? T[number] : T[keyof T];

export type Entries<T extends Array<any> | PlainObject> = ValueOf<{
  [K in keyof T]-?: [K, T[K]];
}>[];

export type NestedObjectOrArray<T> =
  | Array<NestedObjectOrArray<T> | T>
  | { [key: string]: NestedObjectOrArray<T> | T };
