import { convertToEntityDescriptor } from './convertToEntityDescriptor';

describe('convertToEntityDescriptor', () => {
  it('Should correctly convert value to descriptor', () => {
    expect(convertToEntityDescriptor(null)).toEqual({ checkMode: 'equals', value: null });
    expect(convertToEntityDescriptor(undefined)).toEqual({ checkMode: 'equals', value: undefined });
    expect(convertToEntityDescriptor(true)).toEqual({ checkMode: 'equals', value: true });
    expect(convertToEntityDescriptor(1)).toEqual({ checkMode: 'equals', value: 1 });
    expect(convertToEntityDescriptor('string')).toEqual({ checkMode: 'equals', value: 'string' });
    expect(convertToEntityDescriptor([])).toEqual({
      checkMode: 'equals',
      value: []
    });
    expect(convertToEntityDescriptor({ key: 'value' })).toEqual({
      checkMode: 'equals',
      value: { key: 'value' }
    });
  });

  it('Should return same value if descriptor provided', () => {
    expect(convertToEntityDescriptor({ checkMode: 'exists' })).toEqual({ checkMode: 'exists' });
    expect(convertToEntityDescriptor({ checkMode: 'equals', value: 'string' })).toEqual({
      checkMode: 'equals',
      value: 'string'
    });
  });
});
