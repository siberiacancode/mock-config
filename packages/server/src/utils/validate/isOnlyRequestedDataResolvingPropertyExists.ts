import type { PlainObject } from '@/utils/types';

const DATA_RESOLVING_PROPERTIES = ['data', 'file', 'queue'] as const;

export const isOnlyRequestedDataResolvingPropertyExists = (
  object: PlainObject,
  requestedDataResolvingProperty: (typeof DATA_RESOLVING_PROPERTIES)[number]
) =>
  DATA_RESOLVING_PROPERTIES.every((dataResolvingProperty) =>
    dataResolvingProperty === requestedDataResolvingProperty
      ? dataResolvingProperty in object
      : !(dataResolvingProperty in object)
  );
