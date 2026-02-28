import type { Express } from 'express';
import type { GraphQLMockServerConfig } from '../../utils/types';
export declare const createGraphQLMockServer: (graphqlMockServerConfig: Omit<GraphQLMockServerConfig, "port">, server?: Express) => Express;
