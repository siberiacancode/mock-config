import { describe, expect, it } from 'vitest';

import { formatTimestamp } from './formatTimestamp';

describe('formatTimestamp', () => {
  it('Should correctly format timestamp', () => {
    expect(formatTimestamp(1735623296789)).toBe('31.12.2024, 12:34:56,789');
  });
});
