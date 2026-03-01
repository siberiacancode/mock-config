import type { FlatMockServerConfig } from 'mock-config-server';

import { getUserRequest, getUsersRequest, postUserRequest } from './mock-requests';

const mockServerConfig: FlatMockServerConfig = [
  {
    port: 31299,
    baseUrl: '/'
  },
  {
    name: 'rest',
    configs: [getUserRequest, getUsersRequest, postUserRequest]
  }
];

export default mockServerConfig;
