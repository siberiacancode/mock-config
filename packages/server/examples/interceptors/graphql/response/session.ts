import type { FlatMockServerConfig } from 'mock-config-server';

import { createFlatMockServer, startFlatMockServer } from 'mock-config-server';

const COOKIE_NAME = 'auth-token';
export const mockServerConfig: FlatMockServerConfig = [
  {
    configs: [
      {
        operationType: 'query',
        operationName: 'GetSession',
        routes: [{ data: { id: 1, emoji: '🎉', role: 'admin' } }],
        interceptors: {
          response: (data, params) => {
            if (!params.getCookie(COOKIE_NAME)) {
              params.setStatusCode(401);
              return { error: 'unauthorized' };
            }

            return data;
          }
        }
      },
      {
        operationType: 'query',
        operationName: 'Logout',
        routes: [{ data: { id: 1, emoji: '🎉', role: 'admin' } }],
        interceptors: {
          response: (data, params) => {
            params.clearCookie(COOKIE_NAME);
            return data;
          }
        }
      },
      {
        operationType: 'query',
        operationName: 'SignIn',
        routes: [
          {
            data: { success: true }
          }
        ],
        interceptors: {
          response: (data, params) => {
            params.setCookie(COOKIE_NAME, 'mock-config-token', {
              maxAge: 3600,
              sameSite: true,
              secure: true
            });

            return data;
          }
        }
      }
    ]
  }
];

createFlatMockServer(mockServerConfig);
startFlatMockServer(mockServerConfig);
