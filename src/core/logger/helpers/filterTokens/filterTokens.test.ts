import { filterTokens } from './filterTokens';

describe('filterTokens', () => {
  const tokens = {
    key1: 'value1',
    key2: 'value2',
    key3: 'value3',
    key4: {
      nestedKey1: 'nestedValue1',
      nestedKey2: 'nestedValue2',
      nestedKey3: 'nestedValue3'
    }
  };

  it('Should remain only "true" options by whitelist logic on first level', () => {
    expect(
      filterTokens(tokens, {
        key1: true,
        key2: false,
        key4: true
      })
    ).toStrictEqual({
      key1: 'value1',
      key4: {
        nestedKey1: 'nestedValue1',
        nestedKey2: 'nestedValue2',
        nestedKey3: 'nestedValue3'
      }
    });
  });

  it('Should remain only "true" options by whitelist logic on second level', () => {
    expect(
      filterTokens(tokens, {
        key4: {
          nestedKey1: true,
          nestedKey2: true
        }
      })
    ).toStrictEqual({
      key4: {
        nestedKey1: 'nestedValue1',
        nestedKey2: 'nestedValue2'
      }
    });

    expect(
      filterTokens(tokens, {
        key4: {
          nestedKey1: true,
          nestedKey2: false
        }
      })
    ).toStrictEqual({
      key4: {
        nestedKey1: 'nestedValue1'
      }
    });
  });

  it('Should remove all "false" options by blacklist logic on second level', () => {
    expect(
      filterTokens(tokens, {
        key1: true,
        key4: {
          nestedKey1: false,
          nestedKey2: false
        }
      })
    ).toStrictEqual({
      key1: 'value1',
      key4: {
        nestedKey3: 'nestedValue3'
      }
    });
  });
});
