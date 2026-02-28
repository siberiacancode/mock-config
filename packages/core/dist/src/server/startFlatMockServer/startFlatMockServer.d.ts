import type { FlatMockServerConfig } from '../../utils/types';
export declare const startFlatMockServer: (flatMockServerConfig: FlatMockServerConfig) => import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse> & {
    destroy: import("http").Server["close"];
};
