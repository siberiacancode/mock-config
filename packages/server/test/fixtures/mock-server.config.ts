import { healthResponse } from './health-response';

export default [
  {
    configs: [
      {
        method: 'get',
        path: '/health',
        routes: [{ data: healthResponse }]
      }
    ]
  }
];
