import express from 'express';
import request from 'supertest';

import { errorMiddleware } from './errorMiddleware';

describe('errorMiddleware', () => {
  it('Should handle error from server handler', async () => {
    const server = express();

    server.get('/error', () => {
      throw new Error('error');
    });

    server.get('/success', (_request, response) => {
      response.send('success');
    });

    errorMiddleware(server);

    const errorResponse = await request(server).get('/error');
    const successResponse = await request(server).get('/success');

    expect(errorResponse.statusCode).toEqual(500);
    expect(errorResponse.text).toContain('error');

    expect(successResponse.statusCode).toEqual(200);
    expect(successResponse.text).toEqual('success');
  });
});
