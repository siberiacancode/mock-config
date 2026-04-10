import type { EntityDescriptor } from '@/utils/types';

import { checkModeSymbol } from '@/utils/constants';

import { isEntityDescriptor } from '../isEntityDescriptor/isEntityDescriptor';

export const convertToEntityDescriptor = (valueOrDescriptor: any): EntityDescriptor =>
  isEntityDescriptor(valueOrDescriptor)
    ? valueOrDescriptor
    : { [checkModeSymbol]: 'equals', value: valueOrDescriptor };
