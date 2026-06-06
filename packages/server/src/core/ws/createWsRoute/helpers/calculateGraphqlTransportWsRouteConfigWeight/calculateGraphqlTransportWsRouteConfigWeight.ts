import type { GraphqlTransportWsRouteConfig } from '@/utils/types';

export const calculateGraphqlTransportWsRouteConfigWeight = (
  graphqlTransportWsRouteConfig: GraphqlTransportWsRouteConfig
) => Object.keys(graphqlTransportWsRouteConfig.entities?.variables ?? {}).length;
