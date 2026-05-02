import { createServer } from 'node:http';

import type { MockServerComponent, MockServerConfig } from '@/utils/types';

import { sendFetchResponse, toFetchRequest } from './helpers/http';
import { toMockServerRequest } from './helpers/http/toMockServerRequest/toMockServerRequest';
import { NextError, prepareRestRoute } from './helpers/routes';

export const createNativeMockServer = (mockServerConfig: MockServerConfig) => {
  const [option] = mockServerConfig;

  const isOptionSettings = !('configs' in option);
  const mockServerSettings = isOptionSettings ? option : {};
  const mockServerComponents = (
    isOptionSettings ? mockServerConfig.slice(1) : mockServerConfig
  ) as MockServerComponent[];

  const restRoute = prepareRestRoute(mockServerSettings, mockServerComponents);
  const handle404 = () => new Response(null, { status: 404 });

  // TODO: каждая функция должна уметь вызывать next, либо возвращать ответ. Если функция next вызвана, то надо идти
  // на следующую итерацию, а иначе вернуть ответ
  const handlers = [restRoute, handle404];

  // callback только для http, т.е. web socket отдельно
  const server = createServer(async (request, response) => {
    try {
      const mockServerRequest = await toMockServerRequest(toFetchRequest(request));

      for (const handler of handlers) {
        try {
          const fetchResponse = await handler(mockServerRequest);
          await sendFetchResponse(response, fetchResponse);
          break;
        } catch (error) {
          if (error instanceof NextError) continue;
          throw error;
        }
      }
    } catch (error) {
      console.error(error);

      if (!response.headersSent) {
        response.statusCode = 500;
      }
      if (!response.writableEnded) {
        response.end();
      }
    }
  });

  return server;
};
