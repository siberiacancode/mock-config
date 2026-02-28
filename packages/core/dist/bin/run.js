#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "run", {
    enumerable: true,
    get: function() {
        return run;
    }
});
const _server = require("../src/server");
const _helpers = require("../src/utils/helpers");
const run = (mockConfig, { baseUrl, port, staticPath })=>{
    console.warn(`**DEPRECATION WARNING**\nThe old mock config format is deprecated and will be removed in the next major version. Please use new format of config (flat config); see our doc (https://github.com/siberiacancode/mock-config-server) for more information`);
    try {
        const mergedMockServerConfig = {
            ...mockConfig,
            ...baseUrl && {
                baseUrl
            },
            ...port && {
                port
            },
            ...staticPath && {
                staticPath
            }
        };
        if (!mergedMockServerConfig.rest && !mergedMockServerConfig.graphql && 'configs' in mergedMockServerConfig) {
            const mergedApiMockServerConfig = mergedMockServerConfig;
            if (Array.isArray(mergedApiMockServerConfig.configs) && (0, _helpers.isPlainObject)(mergedApiMockServerConfig.configs[0]) && 'path' in mergedApiMockServerConfig.configs[0]) {
                return (0, _server.startRestMockServer)(mergedApiMockServerConfig);
            }
            if (Array.isArray(mergedApiMockServerConfig.configs) && (0, _helpers.isPlainObject)(mergedApiMockServerConfig.configs[0]) && ('query' in mergedApiMockServerConfig.configs[0] || 'operationName' in mergedApiMockServerConfig.configs[0])) {
                return (0, _server.startGraphQLMockServer)(mergedApiMockServerConfig);
            }
            return (0, _server.startRestMockServer)(mergedApiMockServerConfig);
        }
        return (0, _server.startMockServer)(mergedMockServerConfig);
    } catch (error) {
        console.error(error.message);
    }
};
