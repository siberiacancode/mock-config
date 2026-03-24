import type { MockServerConfig } from 'mock-config-server';

import { createMockServer, startMockServer } from 'mock-config-server';

const COOKIE_NAME = 'auth-token';
export const mockServerConfig: MockServerConfig = [
  {
    configs: [
      {
        method: 'get',
        path: '/session',
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
        method: 'post',
        path: '/logout',
        routes: [{ data: { id: 1, emoji: '🎉', role: 'admin' } }],
        interceptors: {
          response: (data, params) => {
            params.clearCookie(COOKIE_NAME);
            return data;
          }
        }
      },
      {
        method: 'post',
        path: '/signin',
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

createMockServer(mockServerConfig);
startMockServer(mockServerConfig);
