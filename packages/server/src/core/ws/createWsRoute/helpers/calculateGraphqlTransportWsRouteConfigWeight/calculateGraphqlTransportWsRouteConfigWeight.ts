import type { GraphqlTransportWsRouteConfig } from '@/utils/types';

export const calculateGraphqlTransportWsRouteConfigWeight = (
  graphqlTransportWsRouteConfig: GraphqlTransportWsRouteConfig
) => {
  const { entities } = graphqlTransportWsRouteConfig;
  if (!entities) return 0;

  const { variables } = entities;
  if (!variables) return 0;

  return Object.keys(variables).length;
};
