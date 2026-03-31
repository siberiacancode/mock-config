import type { EntitiesDescriptor } from '@/utils/types';

import { checkModeSymbol } from '@/utils/constants';

import { isPlainObject } from '../../isPlainObject/isPlainObject';

export const isEntitiesDescriptor = (value: any): value is EntitiesDescriptor =>
  isPlainObject(value) && Object.getOwnPropertySymbols(value).includes(checkModeSymbol);