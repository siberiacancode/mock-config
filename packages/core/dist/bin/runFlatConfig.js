#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "runFlatConfig", {
    enumerable: true,
    get: function() {
        return runFlatConfig;
    }
});
const _server = require("../src/server");
const runFlatConfig = (flatMockServerConfig, { baseUrl, port, staticPath })=>{
    try {
        const [option, ...flatMockServerComponents] = flatMockServerConfig;
        const flatMockServerSettings = !('configs' in option) ? option : undefined;
        const mergedFlatMockServerConfig = [
            {
                ...flatMockServerSettings,
                ...baseUrl && {
                    baseUrl
                },
                ...port && {
                    port
                },
                ...staticPath && {
                    staticPath
                }
            },
            ...flatMockServerSettings ? flatMockServerComponents : flatMockServerConfig
        ];
        return (0, _server.startFlatMockServer)(mergedFlatMockServerConfig);
    } catch (error) {
        console.error(error.message);
    }
};
