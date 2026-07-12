export const stringify = (object: object): object => {
  if (typeof object !== 'object' || object === null) return object;

  if (Array.isArray(object)) return object.map(stringify);

  const result = {} as Record<string, object | string>;
  for (const [key, value] of Object.entries(object)) {
    if (typeof value === 'function' || value instanceof RegExp) {
      result[key] = value.toString();
    } else if (typeof value === 'object' && value !== null) {
      result[key] = stringify(value);
    } else {
      result[key] = value;
    }
  }

  return result;
};
