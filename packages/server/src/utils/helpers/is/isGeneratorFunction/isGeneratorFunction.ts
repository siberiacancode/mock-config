export const isGeneratorFunction = <Args extends unknown[]>(
  value: (...args: Args) => unknown
): value is (...args: Args) => Generator<unknown, unknown, unknown> =>
  value.constructor?.name === 'GeneratorFunction';
