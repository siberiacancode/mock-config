import type { RestMockServerConfig } from '../../utils/types';
export declare const startRestMockServer: (restMockServerConfig: RestMockServerConfig) => import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse> & {
    destroy: import("http").Server["close"];
};
