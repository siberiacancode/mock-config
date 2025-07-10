import { isEntityDescriptor } from './isEntityDescriptor';

describe('isEntityDescriptor', () => {
  it('Should correctly define descriptor', () => {
    expect(isEntityDescriptor(null)).toEqual(false);
    expect(isEntityDescriptor(undefined)).toEqual(false);
    expect(isEntityDescriptor(true)).toEqual(false);
    expect(isEntityDescriptor(1)).toEqual(false);
    expect(isEntityDescriptor('string')).toEqual(false);
    expect(isEntityDescriptor([])).toEqual(false);
    expect(isEntityDescriptor({ key: 'value' })).toEqual(false);
    expect(isEntityDescriptor({ checkMode: 'exists' })).toEqual(true);
    expect(isEntityDescriptor({ checkMode: 'equals', value: 'string' })).toEqual(true);
  });
});
