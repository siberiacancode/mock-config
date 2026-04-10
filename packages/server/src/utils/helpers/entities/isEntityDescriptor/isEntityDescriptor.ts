import type { EntityDescriptor } from '@/utils/types';

import { checkModeSymbol } from '@/utils/constants';

import { isPlainObject } from '../../isPlainObject/isPlainObject';

export const isEntityDescriptor = (value: any): value is EntityDescriptor =>
  isPlainObject(value) && Object.getOwnPropertySymbols(value).includes(checkModeSymbol);
