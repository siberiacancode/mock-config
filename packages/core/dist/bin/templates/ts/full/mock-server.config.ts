import type { FlatMockServerConfig } from 'mock-config-server';

import { createUserMutation, getUserQuery, getUsersQuery } from './mock-requests/graphql';
import { getUserRequest, getUsersRequest, postUserRequest } from './mock-requests/rest';

const mockServerConfig: FlatMockServerConfig = [
  {
    port: 31299,
    baseUrl: '/'
  },
  {
    name: 'rest',
    configs: [getUserRequest, getUsersRequest, postUserRequest]
  },
  {
    name: 'graphql',
    configs: [getUserQuery, getUsersQuery, createUserMutation]
  }
];

export default mockServerConfig;
