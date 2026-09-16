import { getInterceptorPhase, getSerializedInterceptors } from './interceptor';

export const getComponentInterceptors = (component: MockServerComponent) => {
  const phases = getSerializedInterceptors(component.interceptors).map((interceptor) =>
    getInterceptorPhase(interceptor.$interceptor)
  );

  return {
    request: phases.includes('request'),
    response: phases.includes('response')
  };
};
