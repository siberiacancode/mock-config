import type { DatabaseMockServerConfig } from '../../utils/types';
export declare const startDatabaseMockServer: (databaseMockServerConfig: DatabaseMockServerConfig) => import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse> & {
    destroy: import("http").Server["close"];
};
