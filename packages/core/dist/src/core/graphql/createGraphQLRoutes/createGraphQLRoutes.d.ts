import type { IRouter } from 'express';
import type { GraphqlConfig, Interceptors } from '../../../utils/types';
interface CreateGraphQLRoutesParams {
    graphqlConfig: GraphqlConfig;
    router: IRouter;
    serverResponseInterceptor?: Interceptors<'graphql'>['response'];
}
export declare const createGraphQLRoutes: ({ router, graphqlConfig, serverResponseInterceptor }: CreateGraphQLRoutesParams) => IRouter;
export {};
