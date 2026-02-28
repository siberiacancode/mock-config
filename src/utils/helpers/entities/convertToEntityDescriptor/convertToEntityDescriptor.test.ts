import { checkModeSymbol } from '@/utils/constants';

import { convertToEntityDescriptor } from './convertToEntityDescriptor';

describe('convertToEntityDescriptor', () => {
  it('Should correctly convert value to descriptor', () => {
    expect(convertToEntityDescriptor(null)).toEqual({ [checkModeSymbol]: 'equals', value: null });
    expect(convertToEntityDescriptor(undefined)).toEqual({
      [checkModeSymbol]: 'equals',
      value: undefined
    });
    expect(convertToEntityDescriptor(true)).toEqual({ [checkModeSymbol]: 'equals', value: true });
    expect(convertToEntityDescriptor(1)).toEqual({ [checkModeSymbol]: 'equals', value: 1 });
    expect(convertToEntityDescriptor('string')).toEqual({
      [checkModeSymbol]: 'equals',
      value: 'string'
    });
    expect(convertToEntityDescriptor([])).toEqual({
      [checkModeSymbol]: 'equals',
      value: []
    });
    expect(convertToEntityDescriptor({ key: 'value' })).toEqual({
      [checkModeSymbol]: 'equals',
      value: { key: 'value' }
    });
  });

  it('Should return same value if descriptor provided', () => {
    expect(convertToEntityDescriptor({ [checkModeSymbol]: 'exists' })).toEqual({
      [checkModeSymbol]: 'exists'
    });
    expect(convertToEntityDescriptor({ [checkModeSymbol]: 'equals', value: 'string' })).toEqual({
      [checkModeSymbol]: 'equals',
      value: 'string'
    });
  });
});
