import type { EntityDescriptor } from '@/utils/types';

import { isPlainObject } from '../../isPlainObject/isPlainObject';

export const isEntityDescriptor = (value: any): value is EntityDescriptor =>
  isPlainObject(value) && 'checkMode' in value;
