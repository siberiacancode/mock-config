import type { MockServerConfigArgv } from '../src/utils/types';
export declare const build: (argv: MockServerConfigArgv) => Promise<(import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse> & {
    destroy: import("http").Server["close"];
}) | undefined>;
