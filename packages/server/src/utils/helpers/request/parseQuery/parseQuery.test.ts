import { describe, expect, it } from 'vitest';

import { parseQuery } from './parseQuery';

describe('parseQuery', () => {
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

  it('Should decode encoded values', () => {
    const query = parseQuery('/ws?message=hello%20world');
    expect(query).toEqual({
      message: 'hello world'
    });
  });
});
