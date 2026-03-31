import { describe, expect, it } from 'vitest';

import { isEntityDescriptor } from './isEntityDescriptor';
import {checkModeSymbol} from '@/utils/constants';

describe('isEntityDescriptor', () => {
  it('Should correctly define descriptor', () => {
    expect(isEntityDescriptor(null)).toEqual(false);
    expect(isEntityDescriptor(undefined)).toEqual(false);
    expect(isEntityDescriptor(true)).toEqual(false);
    expect(isEntityDescriptor(1)).toEqual(false);
    expect(isEntityDescriptor('string')).toEqual(false);
    expect(isEntityDescriptor([])).toEqual(false);
    expect(isEntityDescriptor({ key: 'value' })).toEqual(false);
    expect(isEntityDescriptor({ [checkModeSymbol]: 'exists' })).toEqual(true);
    expect(isEntityDescriptor({ [checkModeSymbol]: 'equals', value: 'string' })).toEqual(true);
  });
});
