export const isGenerator = <Handler extends (...args: any[]) => unknown>(
  value: Handler
): value is Handler & ((...args: Parameters<Handler>) => Generator<unknown, unknown, unknown>) =>
  value.constructor?.name === 'GeneratorFunction';
