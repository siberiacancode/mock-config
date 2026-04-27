import type {
  BaseUrl,
  MockServerComponent,
  MockServerSettings,
  RestRequestArtifact
} from '@/utils/types';

import { calculateRestRouteConfigWeight, prepareRestRequestArtifacts } from '@/core/rest';
import { urlJoin } from '@/utils/helpers';

import type { NativeRestRequestArtifact } from '../../types';

import { createRestRoute } from './createRestRoute';

export const prepareRestRoute = (
  mockServerSettings: MockServerSettings,
  mockServerComponents: MockServerComponent[]
) => {
  const { interceptors, baseUrl: serverBaseUrl = '/' } = mockServerSettings;

  const restRequestArtifacts = prepareRestRequestArtifacts(
    mockServerComponents.reduce((acc, component) => {
      component.configs
        .filter((config) => 'method' in config)
        .forEach((restRequestConfig) => {
          restRequestConfig.routes.forEach((route) => {
            acc.push({
              baseUrl: urlJoin(serverBaseUrl, component.baseUrl ?? '') as BaseUrl,
              method: restRequestConfig.method,
              path: restRequestConfig.path,
              config: route,
              weight: calculateRestRouteConfigWeight(route),
              serverResponseInterceptor: interceptors?.response,
              serverRequestInterceptor: interceptors?.request,
              requestResponseInterceptor: restRequestConfig.interceptors?.response,
              requestRequestInterceptor: restRequestConfig.interceptors?.request,
              componentResponseInterceptor: component.interceptors?.response,
              componentRequestInterceptor: component.interceptors?.request,
              routeResponseInterceptor: route.interceptors?.response,
              routeRequestInterceptor: route.interceptors?.request
            });
          });
        });

      return acc;
    }, [] as RestRequestArtifact[])
  ) as unknown as NativeRestRequestArtifact[];

  const restRoute = createRestRoute({ restRequestArtifacts });

  return restRoute;
};
