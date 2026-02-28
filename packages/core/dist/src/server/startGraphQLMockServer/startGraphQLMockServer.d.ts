import type { GraphQLMockServerConfig } from '../../utils/types';
export declare const startGraphQLMockServer: (graphQLMockServerConfig: GraphQLMockServerConfig) => import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse> & {
    destroy: import("http").Server["close"];
};
