export const isGeneratorFunction = (
  value: unknown
): value is (...args: any[]) => Generator<unknown, unknown, unknown> =>
  typeof value === 'function' && value.constructor?.name === 'GeneratorFunction';
