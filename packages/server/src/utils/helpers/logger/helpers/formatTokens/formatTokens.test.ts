import { describe, expect, it } from 'vitest';

import { formatTokens } from './formatTokens';

describe('formatTokens', () => {
  it('Should correctly format tokens', () => {
    const tokens = {
      timestamp: 1735623296789,
      method: 'get',
      statusCode: 200
    };

    const result = formatTokens(tokens);

    expect(result).toStrictEqual({
      timestamp: '31.12.2024, 12:34:56,789',
      method: 'GET',
      statusCode: 200
    });
  });
});
