import { describe, expect, it } from 'vitest';

import { urlJoin } from './urlJoin';

describe('urlJoin', () => {
  it('Should correctly merge paths', () => {
    expect(urlJoin('/base', '/rest')).toEqual('/base/rest');
    expect(urlJoin('/base', 'rest')).toEqual('/base/rest');
    expect(urlJoin('/base', 'rest', '/users')).toEqual('/base/rest/users');
  });

  it('Should convert Windows-like path to Unix-like', () => {
    expect(urlJoin('C:\\mock-config-server\\dist\\src\\static\\views')).toEqual(
      'C:/mock-config-server/dist/src/static/views'
    );
  });

  it('Should convert long Windows-like path to Unix-like', () => {
    expect(urlJoin('\\\\?\\mock-config-server\\dist\\src\\static\\views')).toEqual(
      'mock-config-server/dist/src/static/views'
    );
  });

  it('Should convert Windows-like path with double backslashes to Unix-like', () => {
    expect(urlJoin('C:\\\\mock-config-server\\dist\\src\\static\\views')).toEqual(
      'C:/mock-config-server/dist/src/static/views'
    );
  });
});
