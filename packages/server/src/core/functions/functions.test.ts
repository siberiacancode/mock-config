import { describe, expect, it } from 'vitest';

import type { MockServerComponent } from '@/utils/types';

import { validateMockServerConfig } from '@/utils/validate';

import { graphql } from './graphql/graphql';
import { mock } from './mock';
import { rest } from './rest/rest';
import { ws } from './ws/ws';

/**
 * Factory tests assert the built shape, schema tests parse handwritten objects — so a factory can
 * start emitting a key no schema allows and both stay green. Every helper is checked here instead.
 */
const validate = (config: MockServerComponent['configs'][number]) =>
  validateMockServerConfig(mock({ name: 'sugar', configs: [config] }));

describe('functions: built config passes validation', () => {
  it('Should validate rest methods', () => {
    expect(() => validate(rest.get('/users', { ok: true }))).not.toThrow();
    expect(() => validate(rest.post('/users', { ok: true }))).not.toThrow();
    expect(() => validate(rest.put('/users', { ok: true }))).not.toThrow();
    expect(() => validate(rest.patch('/users', { ok: true }))).not.toThrow();
    expect(() => validate(rest.delete('/users', { ok: true }))).not.toThrow();
    expect(() => validate(rest.options('/users', { ok: true }))).not.toThrow();
  });

  it('Should validate rest streaming methods', () => {
    expect(() => validate(rest.sse('/events', () => undefined))).not.toThrow();
    expect(() => validate(rest.stream('/events', () => undefined))).not.toThrow();
  });

  it('Should validate rest settings and matchers', () => {
    expect(() =>
      validate(
        rest.get('/users', { ok: true }, { status: 201, delay: 1, match: { queries: { id: '1' } } })
      )
    ).not.toThrow();
  });

  it('Should validate rest polling and file', () => {
    expect(() =>
      validate(rest.get('/users', rest.polling([{ response: { ok: true }, time: 1 }])))
    ).not.toThrow();
    expect(() => validate(rest.get('/users', rest.file('./package.json')))).not.toThrow();
  });

  it('Should validate graphql operations', () => {
    expect(() => validate(graphql.query('GetUsers', { data: { ok: true } }))).not.toThrow();
    expect(() => validate(graphql.mutation('CreateUser', { data: { ok: true } }))).not.toThrow();
  });

  it('Should validate graphql settings and matchers', () => {
    expect(() =>
      validate(
        graphql.query(
          'GetUsers',
          { data: { ok: true } },
          { status: 201, delay: 1, match: { variables: { id: '1' } } }
        )
      )
    ).not.toThrow();
  });

  it('Should validate graphql subscription', () => {
    expect(() => validate(graphql.subscription('OnUser', { data: { ok: true } }))).not.toThrow();
  });

  it('Should validate ws', () => {
    expect(() => validate(ws.connection(() => ({ ok: true })))).not.toThrow();
    expect(() => validate(ws.message(() => ({ ok: true })))).not.toThrow();
  });
});
