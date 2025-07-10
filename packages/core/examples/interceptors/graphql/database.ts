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
        operationType: 'query',
        operationName: 'GetTodos',
        routes: [
          {
            data: () => todos
          }
        ]
      },
      {
        operationType: 'query',
        operationName: 'GetTodo',
        routes: [
          {
            data: (request) => todos.find((todo) => todo.id === request.body.variables.id)
          }
        ]
      },
      {
        operationType: 'mutation',
        operationName: 'AddTodo',
        routes: [{ data: { success: true } }],
        interceptors: {
          response: (data, { request }) => {
            todos.push(request.body.variables);
            return data;
          }
        }
      },
      {
        operationType: 'mutation',
        operationName: 'ChangeTodo',
        routes: [
          {
            data: { success: true },
            interceptors: {
              response: (data, { request }) => {
                todos = todos.map((todo) => {
                  if (todo.id === request.body.variables.id) {
                    return { ...todo, ...request.body.variables };
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
        operationType: 'mutation',
        operationName: 'DeleteTodo',
        routes: [
          {
            data: { success: true },
            interceptors: {
              response: (data, { request }) => {
                todos = todos.filter((todo) => todo.id !== request.body.variables.id);
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
