import { describe, expect, it } from 'vitest';

import { parseRequestQuery } from './parseQuery';

describe('parseRequestQuery', () => {
  it('Should return an empty object if request url is empty', () => {
    expect(parseRequestQuery()).toEqual({});
    expect(parseRequestQuery('')).toEqual({});
  });

  it('Should parse single query parameter', () => {
    const query = parseRequestQuery('/ws?room=public');
    expect(query).toEqual({ room: 'public' });
  });

  it('Should parse repeated keys into array', () => {
    const query = parseRequestQuery('/ws?room=public&room=private&room=vip');
    expect(query).toEqual({
      room: ['public', 'private', 'vip']
    });
  });

  it('Should parse mixed params with array and scalar keys', () => {
    const query = parseRequestQuery('/ws?room=public&room=private&user=42');
    expect(query).toEqual({
      room: ['public', 'private'],
      user: '42'
    });
  });

  it('Should decode encoded values', () => {
    const query = parseRequestQuery('/ws?message=hello%20world');
    expect(query).toEqual({
      message: 'hello world'
    });
  });
});
