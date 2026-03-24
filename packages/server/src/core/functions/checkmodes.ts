export const equals = (value: any) =>
  ({
    checkMode: 'equals',
    oneOf: false,
    value
  }) as const;

export const notEquals = (value: any) =>
  ({
    checkMode: 'notEquals',
    oneOf: false,
    value
  }) as const;

export const exists = () =>
  ({
    checkMode: 'exists'
  }) as const;

export const notExists = () =>
  ({
    checkMode: 'notExists'
  }) as const;
