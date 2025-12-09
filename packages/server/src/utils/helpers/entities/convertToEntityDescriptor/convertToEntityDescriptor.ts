import type { EntityDescriptor } from '@/utils/types';

import { isEntityDescriptor } from '../isEntityDescriptor/isEntityDescriptor';

export const convertToEntityDescriptor = (valueOrDescriptor: any): EntityDescriptor =>
  isEntityDescriptor(valueOrDescriptor)
    ? valueOrDescriptor
    : { checkMode: 'equals', value: valueOrDescriptor };
