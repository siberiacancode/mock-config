#!/usr/bin/env node
import type { MockServerConfig, MockServerConfigArgv } from '../src';
export declare const run: (mockConfig: MockServerConfig, { baseUrl, port, staticPath }: MockServerConfigArgv) => (import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse> & {
    destroy: import("http").Server["close"];
}) | undefined;
