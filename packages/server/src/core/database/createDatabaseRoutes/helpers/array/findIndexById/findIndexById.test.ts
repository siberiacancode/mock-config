import { describe, expect, it } from 'vitest';

import { findIndexById } from './findIndexById';

describe('findIndexById', () => {
  const array = [{ id: 1 }, { id: 2 }];

  it('Should return index of item by id', () => {
    expect(findIndexById(array, 2)).toBe(1);
  });

  it('Should return -1 if item with id does not exists', () => {
    expect(findIndexById(array, 3)).toBe(-1);
  });

  it('Should compare ids independently of type: string or number', () => {
    expect(findIndexById(array, '2')).toBe(1);
  });
});
