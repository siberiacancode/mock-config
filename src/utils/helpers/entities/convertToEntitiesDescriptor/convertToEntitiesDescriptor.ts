import type { EntitiesDescriptor } from '@/utils/types';

import { checkModeSymbol } from '@/utils/constants';

import { isEntitiesDescriptor } from '../isEntitiesDescriptor/isEntitiesDescriptor';

export const convertToEntitiesDescriptor = (valueOrDescriptor: any): EntitiesDescriptor =>
  isEntitiesDescriptor(valueOrDescriptor)
    ? valueOrDescriptor
    : { [checkModeSymbol]: 'every', value: valueOrDescriptor };
