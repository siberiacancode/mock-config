import express from 'express';
import request from 'supertest';

import { cookieParseMiddleware } from './cookieParseMiddleware';

describe('cookieParseMiddleware', () => {
  it('Should correctly parse cookies', async () => {
    const server = express();
    cookieParseMiddleware(server);

    let parsedCookies = {};

    server.use((request, _response, next) => {
      parsedCookies = request.cookies;
      next();
    });

    await request(server).get('/').set({ cookie: 'key=value' });

    expect(parsedCookies).toEqual({ key: 'value' });
  });
});
