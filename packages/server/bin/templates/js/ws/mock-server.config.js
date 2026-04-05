import { mock, ws } from 'mock-config-server';

export default mock(
  { port: 7777, baseUrl: '/' },
  {
    name: 'ws',
    baseUrl: '/ws',
    configs: [
      ws.event('notification', { message: `${new Date().toISOString()} Hello from server` }),
      ws.message(async (params) => {
        await params.setDelay(200);
        params.send({ ok: true });
      })
    ]
  }
);
