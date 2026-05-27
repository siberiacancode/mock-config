import { sleep } from '@/utils/helpers';

import type { NativeRequestInterceptor } from '../../types';

interface CallNativeRequestInterceptorParams {
  interceptor: NativeRequestInterceptor;
  request: MockServerRequest;
}

export const callRequestInterceptor = async (params: CallNativeRequestInterceptorParams) => {
  const { request, interceptor } = params;

  const getHeader = (name: string) => request.headers[name];
  const getHeaders = () => request.headers;
  const getCookie = (name: string) => request.cookies[name];

  await interceptor({
    request,
    getHeader,
    getHeaders,
    getCookie,
    setDelay: async (delay) => {
      await sleep(delay === Infinity ? 99999999 : delay);
    }
  });
};
