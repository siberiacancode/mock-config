export const stringify = (value: unknown, seen = new WeakSet<object>()): unknown => {
  if (typeof value === 'function' || value instanceof RegExp) return value.toString();
  if (typeof value !== 'object' || value === null) return value;

  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  const result = Array.isArray(value)
    ? value.map((item) => stringify(item, seen))
    : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, stringify(item, seen)]));

  seen.delete(value);
  return result;
};
