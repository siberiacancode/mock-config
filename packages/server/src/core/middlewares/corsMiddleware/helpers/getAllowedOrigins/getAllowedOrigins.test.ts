import { describe, expect, it } from 'vitest';

import { getAllowedOrigins } from './getAllowedOrigins';

describe('getAllowedOrigins', () => {
  it('Function should return array if get string or RegExp parameter', () => {
    expect(getAllowedOrigins(/origin/g)).toEqual([/origin/g]);
    expect(getAllowedOrigins('https://origin.com')).toEqual(['https://origin.com']);
  });

  it('Function should return array if get array parameter', () => {
    expect(getAllowedOrigins([/origin/g, 'https://origin.com'])).toEqual([
      /origin/g,
      'https://origin.com'
    ]);
  });
});
