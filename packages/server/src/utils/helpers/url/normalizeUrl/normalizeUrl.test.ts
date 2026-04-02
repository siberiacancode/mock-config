import { describe, expect, it } from 'vitest';

import { normalizeUrl } from './normalizeUrl';

describe('normalizeUrl', () => {
  it('Should normalize empty, root and trailing slashes', () => {
    expect(normalizeUrl('')).toBe('/');
    expect(normalizeUrl('/')).toBe('/');
    expect(normalizeUrl('//')).toBe('/');
    expect(normalizeUrl('/api')).toBe('/api');
    expect(normalizeUrl('/api/')).toBe('/api');
    expect(normalizeUrl('/api///')).toBe('/api');
  });
});
