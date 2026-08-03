export const isSerializedFunction = (value: unknown): value is string =>
  typeof value === 'string' && value.includes('=>');
