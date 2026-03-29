import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import type { Cors } from '@/utils/types';

import { corsMiddleware } from './corsMiddleware';

describe('corsMiddleware', () => {
  const testOrigin = 'https://test.com';

  it('Should set default cors for OPTIONS preflight request if does not set custom cors settings', async () => {
    const server = express();
    const cors: Cors = {
      origin: testOrigin
    };

    corsMiddleware(server, cors);

    const response = await request(server).options('/').set({ origin: testOrigin });

    expect(response.headers).toMatchObject({
      'access-control-allow-headers': '*',
      'access-control-expose-headers': '*',
      'access-control-allow-methods': 'GET,OPTIONS,PUT,PATCH,POST,DELETE',
      'access-control-allow-origin': 'https://test.com',
      'access-control-max-age': '3600',
      'access-control-allow-credentials': 'true'
    });
  });

  it('Should set default cors for request if does not set custom cors settings', async () => {
    const server = express();
    const cors: Cors = {
      origin: testOrigin
    };

    corsMiddleware(server, cors);

    const response = await request(server).get('/').set({ origin: testOrigin });

    expect(response.headers).toMatchObject({
      'access-control-allow-origin': 'https://test.com',
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': '*'
    });

    expect(response.headers).not.toMatchObject({
      'access-control-allow-headers': expect.any(String),
      'access-control-allow-methods': expect.any(String),
      'access-control-max-age': expect.any(String)
    });
  });

  const unsuitableOrigins = [
    'https://uncorrectDomain.com',
    [],
    /https:\/\/uncorrectDomain.com/g,
    () => 'https://uncorrectDomain.com',
    () => Promise.resolve('https://uncorrectDomain.com')
  ];

  unsuitableOrigins.forEach((unsuitableOrigin) => {
    it('Should not set default cors for OPTIONS preflight request if origin does not match', async () => {
      const server = express();
      const cors: Cors = {
        origin: unsuitableOrigin
      };

      corsMiddleware(server, cors);

      const response = await request(server).options('/').set({ origin: testOrigin });

      expect(response.headers).not.toMatchObject({
        'access-control-allow-headers': expect.any(String),
        'access-control-expose-headers': expect.any(String),
        'access-control-allow-methods': expect.any(String),
        'access-control-allow-origin': expect.any(String),
        'access-control-max-age': expect.any(String),
        'access-control-allow-credentials': expect.any(String)
      });
    });

    it('Should not set cors for request if origin does not match', async () => {
      const server = express();
      const cors: Cors = {
        origin: unsuitableOrigin
      };

      corsMiddleware(server, cors);

      const response = await request(server).get('/').set({ origin: testOrigin });

      expect(response.headers).not.toMatchObject({
        'access-control-allow-origin': expect.any(String),
        'access-control-allow-credentials': expect.any(String),
        'access-control-expose-headers': expect.any(String)
      });
    });
  });

  const corsParamsAndHeaders: { params: Omit<Cors, 'origin'>; headers: Record<string, string> }[] =
    [
      {
        params: { allowedHeaders: ['header1', 'header2'] },
        headers: {
          'access-control-allow-headers': 'header1, header2'
        }
      },
      {
        params: { exposedHeaders: ['header1', 'header2'] },
        headers: {
          'access-control-expose-headers': 'header1, header2'
        }
      },
      {
        params: { maxAge: 10000 },
        headers: {
          'access-control-max-age': '10000'
        }
      },
      {
        params: { methods: ['GET', 'POST'] },
        headers: {
          'access-control-allow-methods': 'GET, POST'
        }
      },
      {
        params: { credentials: false },
        headers: {
          'access-control-allow-credentials': 'false'
        }
      }
    ];

  corsParamsAndHeaders.forEach(({ params, headers }) =>
    it(`Should set allow param(s) ${Object.keys(params).join(', ')} to header(s) ${Object.keys(
      headers
    ).join(', ')}`, async () => {
      const server = express();
      const cors: Cors = {
        origin: testOrigin,
        ...params
      };

      corsMiddleware(server, cors);

      const response = await request(server).options('/').set({ origin: testOrigin });

      expect(response.headers).toMatchObject(headers);
    })
  );
});
