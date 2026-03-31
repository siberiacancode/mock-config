import type { EntityDescriptor } from '@/utils/types';

import { isPlainObject } from '../../isPlainObject/isPlainObject';
import {checkModeSymbol} from '@/utils/constants';

export const isEntityDescriptor = (value: any): value is EntityDescriptor =>
  isPlainObject(value) && Object.getOwnPropertySymbols(value).includes(checkModeSymbol);
