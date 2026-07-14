import { getConfigInterceptors } from './getConfigInterceptors';

export const getComponentInterceptors = (component: MockServerComponent) => {
  const configs = component.configs.map(getConfigInterceptors);

  return {
    request: Boolean(component.interceptors?.request) || configs.some((config) => config.request),
    response: Boolean(component.interceptors?.response) || configs.some((config) => config.response)
  };
};
