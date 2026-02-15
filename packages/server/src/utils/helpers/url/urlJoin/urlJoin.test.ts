import { describe, expect, it } from 'vitest';

import { urlJoin } from './urlJoin';

describe('urlJoin', () => {
  it('Should correctly merge paths', () => {
    expect(urlJoin('/base', '/rest')).toEqual('/base/rest');
    expect(urlJoin('/base', 'rest')).toEqual('/base/rest');
    expect(urlJoin('/base', 'rest', '/users')).toEqual('/base/rest/users');
  });
});
