const COMPARATOR_META_SYMBOL = Symbol.for('comparatorMeta');
const INTERCEPTOR_NAME_SYMBOL = Symbol.for('interceptorName');

interface ComparatorMeta {
  args: unknown[];
  name: string;
}

const getComparatorMeta = (value: (...args: unknown[]) => unknown) => {
  const meta = (value as { [COMPARATOR_META_SYMBOL]?: ComparatorMeta })[COMPARATOR_META_SYMBOL];

  if (!meta || typeof meta.name !== 'string' || !Array.isArray(meta.args)) return undefined;
  return meta;
};

const getInterceptorName = (value: (...args: unknown[]) => unknown) => {
  const name = (value as { [INTERCEPTOR_NAME_SYMBOL]?: unknown })[INTERCEPTOR_NAME_SYMBOL];
  return typeof name === 'string' ? name : undefined;
};

export const stringify = (value: unknown, seen = new WeakSet<object>()): unknown => {
  if (typeof value === 'function') {
    const meta = getComparatorMeta(value as (...args: unknown[]) => unknown);

    if (meta) return { $comparator: meta.name, args: meta.args.map((arg) => stringify(arg, seen)) };

    const interceptorName = getInterceptorName(value as (...args: unknown[]) => unknown);

    if (interceptorName) return { $interceptor: interceptorName, code: value.toString() };

    return value.toString();
  }

  if (value instanceof RegExp) return value.toString();
  if (typeof value !== 'object' || value === null) return value;

  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  const result = Array.isArray(value)
    ? value.map((item) => stringify(item, seen))
    : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, stringify(item, seen)]));

  seen.delete(value);
  return result;
};
