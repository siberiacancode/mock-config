import type { FlatMockServerConfig } from 'mock-config-server';

import { createFlatMockServer, startFlatMockServer } from 'mock-config-server';

let todos = [
  { id: '1', name: 'todo 1', checked: false },
  { id: '2', name: 'todo 2', checked: false },
  { id: '3', name: 'todo 3', checked: false }
];

export const mockServerConfig: FlatMockServerConfig = [
  {
    interceptors: {
      request: (params) => params.setDelay(1000)
    }
  },
  {
    configs: [
      {
        path: '/todos',
        method: 'get',
        routes: [
          {
            data: () => todos
          }
        ]
      },
      {
        path: '/todos/:id',
        method: 'get',
        routes: [
          {
            data: (request) => todos.find((todo) => todo.id === request.params.id)
          }
        ]
      },
      {
        path: '/todos',
        method: 'post',
        routes: [{ data: { success: true } }],
        interceptors: {
          response: (data, { request }) => {
            todos.push(request.body);
            return data;
          }
        }
      },
      {
        path: '/todos/:id',
        method: 'put',
        routes: [
          {
            data: { success: true },
            interceptors: {
              response: (data, { request }) => {
                todos = todos.map((todo) => {
                  if (todo.id === request.params.id) {
                    return { ...todo, ...request.body };
                  }

                  return todo;
                });
                return data;
              }
            }
          }
        ]
      },
      {
        path: '/todos/:id',
        method: 'delete',
        routes: [
          {
            data: { success: true },
            interceptors: {
              response: (data, { request }) => {
                todos = todos.filter((todo) => todo.id !== request.params.id);
                return data;
              }
            }
          }
        ]
      }
    ]
  }
];

createFlatMockServer(mockServerConfig);
startFlatMockServer(mockServerConfig);
