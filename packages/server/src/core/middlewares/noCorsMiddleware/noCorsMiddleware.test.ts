import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { noCorsMiddleware } from './noCorsMiddleware';

describe('noCorsMiddleware', () => {
  it('Should set no cors settings for OPTIONS preflight request', async () => {
    const server = express();

    noCorsMiddleware(server);

    const preflightHeaders = {
      'access-control-request-method': 'GET,OPTIONS,PUT,PATCH,POST,DELETE',
      'access-control-request-headers': '*',
      origin: '/'
    };
    const response = await request(server).options('/').set(preflightHeaders);

    expect(response.headers).toMatchObject({
      'access-control-allow-origin': '*',
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': 'GET,OPTIONS,PUT,PATCH,POST,DELETE',
      'access-control-max-age': '3600'
    });
    expect(response.statusCode).toBe(204);
  });

  it('Should set no cors settings for request', async () => {
    const server = express();

    noCorsMiddleware(server);

    const response = await request(server).get('/');

    expect(response.headers).toMatchObject({
      'access-control-allow-origin': '*',
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': '*'
    });

    expect(response.headers).not.toMatchObject({
      'access-control-allow-headers': expect.any(String),
      'access-control-allow-methods': expect.any(String),
      'access-control-max-age': expect.any(String)
    });
  });
});
