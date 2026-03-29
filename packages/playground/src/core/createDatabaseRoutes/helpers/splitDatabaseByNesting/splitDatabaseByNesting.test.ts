import { describe, expect, it } from 'vitest';

import { splitDatabaseByNesting } from './splitDatabaseByNesting';

describe('splitDatabaseByNesting', () => {
  it('Should put in nested database only arrays of objects with unique id (string | number)', () => {
    const databaseConfig = {
      data: {
        key: 'value',
        arrayWithInvalidTypeIds: [{ id: 1 }, null],
        arrayWithNotUniqueIds: [{ id: 1 }, { id: 1 }],
        validArray: [{ id: 1 }, { id: 'string' }]
      }
    };

    const { shallowDatabase, nestedDatabase } = splitDatabaseByNesting(databaseConfig.data);

    expect(shallowDatabase).toStrictEqual({
      key: databaseConfig.data.key,
      arrayWithInvalidTypeIds: databaseConfig.data.arrayWithInvalidTypeIds,
      arrayWithNotUniqueIds: databaseConfig.data.arrayWithNotUniqueIds
    });
    expect(nestedDatabase).toStrictEqual({
      validArray: databaseConfig.data.validArray
    });
  });
});
