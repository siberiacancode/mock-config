#!/usr/bin/env node
import type { FlatMockServerConfig, MockServerConfigArgv } from '../src';
export declare const runFlatConfig: (flatMockServerConfig: FlatMockServerConfig, { baseUrl, port, staticPath }: MockServerConfigArgv) => (import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse> & {
    destroy: import("http").Server["close"];
}) | undefined;
