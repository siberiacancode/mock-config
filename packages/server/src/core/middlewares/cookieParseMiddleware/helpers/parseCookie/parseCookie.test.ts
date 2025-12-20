import { describe, expect, it } from 'vitest';

import { parseCookie } from './parseCookie';

describe('parseCookie', () => {
  it('Should return an empty object for empty string', () => {
    const cookieString = '';
    const cookies = parseCookie(cookieString);

    expect(cookies).toEqual({});
  });

  it('Should return an object with a single key-value pair', () => {
    const cookieString = 'name=value';
    const cookies = parseCookie(cookieString);

    expect(cookies).toEqual({ name: 'value' });
  });

  it('Should return an object with multiple key-value pairs for a cookie string with multiple key-value pairs', () => {
    const cookieString = 'name1=value1; name2=value2; name3=value3';
    const cookies = parseCookie(cookieString);

    expect(cookies).toEqual({ name1: 'value1', name2: 'value2', name3: 'value3' });
  });

  it('Should handle cookies with no value by setting the value to an empty string', () => {
    const cookieString = 'name1';
    const cookies = parseCookie(cookieString);

    expect(cookies).toEqual({ name1: '' });
  });

  it('Should trim whitespace from keys and values', () => {
    const cookieString = ' name1 = value1 ; name2=value2;  name3   =   value3   ';
    const cookies = parseCookie(cookieString);

    expect(cookies).toEqual({ name1: 'value1', name2: 'value2', name3: 'value3' });
  });

  it('Should ignore cookies with no name', () => {
    const cookieString = '=value';
    const cookies = parseCookie(cookieString);

    expect(cookies).toEqual({});
  });
});
