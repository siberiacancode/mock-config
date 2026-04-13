import { describe, expect, it } from 'vitest';

import { parseQuery } from './parseQuery';

describe('parseQuery', () => {
  it('Should return an empty object if request url is empty', () => {
    expect(parseQuery()).toEqual({});
    expect(parseQuery('')).toEqual({});
  });

  it('Should parse single query parameter', () => {
    const query = parseQuery('/ws?room=public');
    expect(query).toEqual({ room: 'public' });
  });

  it('Should parse repeated keys into array', () => {
    const query = parseQuery('/ws?room=public&room=private&room=vip');
    expect(query).toEqual({
      room: ['public', 'private', 'vip']
    });
  });

  it('Should parse mixed params with array and scalar keys', () => {
    const query = parseQuery('/ws?room=public&room=private&user=42');
    expect(query).toEqual({
      room: ['public', 'private'],
      user: '42'
    });
  });

  it('Should decode encoded values', () => {
    const query = parseQuery('/ws?message=hello%20world');
    expect(query).toEqual({
      message: 'hello world'
    });
  });
});
