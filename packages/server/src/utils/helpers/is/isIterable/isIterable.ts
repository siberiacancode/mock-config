export const isIterable = (value: any): value is Iterable<unknown> =>
  value != null && typeof value[Symbol.iterator] === 'function';
