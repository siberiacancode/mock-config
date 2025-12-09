import { getUserRequest, getUsersRequest, postUserRequest } from './mock-requests';

const mockServerConfig = [
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
