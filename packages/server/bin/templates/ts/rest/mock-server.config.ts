import type { MockServerConfig } from 'mock-config-server';

import { getUserRequest, getUsersRequest, postUserRequest } from './mock-requests';

const mockServerConfig: MockServerConfig = [
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
