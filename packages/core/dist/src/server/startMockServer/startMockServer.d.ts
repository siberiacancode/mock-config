import type { MockServerConfig } from '../../utils/types';
export declare const startMockServer: (mockServerConfig: MockServerConfig) => import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse> & {
    destroy: import("http").Server["close"];
};
