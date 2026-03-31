import type { EntityDescriptor } from '@/utils/types';

import { isEntityDescriptor } from '../isEntityDescriptor/isEntityDescriptor';
import {checkModeSymbol} from '@/utils/constants';

export const convertToEntityDescriptor = (valueOrDescriptor: any): EntityDescriptor =>
  isEntityDescriptor(valueOrDescriptor)
    ? valueOrDescriptor
    : { [checkModeSymbol]: 'equals', value: valueOrDescriptor };
