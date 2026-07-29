import { isPlainObject } from '../isPlainObject/isPlainObject';

export const isObjectLike = (value: unknown): value is Record<string, unknown> | unknown[] =>
  isPlainObject(value) || Array.isArray(value);
