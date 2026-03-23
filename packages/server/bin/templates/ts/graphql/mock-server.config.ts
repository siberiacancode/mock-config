import type { MockServerConfig } from 'mock-config-server';

import { createUserMutation, getUserQuery, getUsersQuery } from './mock-requests';

const mockServerConfig: MockServerConfig = [
  {
    port: 31299,
    baseUrl: '/graphql'
  },
  {
    name: 'graphql',
    configs: [getUserQuery, getUsersQuery, createUserMutation]
  }
];

export default mockServerConfig;
