"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveConfigFile", {
    enumerable: true,
    get: function() {
        return resolveConfigFile;
    }
});
const _helpers = require("../../src/utils/helpers");
const _resolveExportsFromSourceCode = require("./resolveExportsFromSourceCode");
const resolveConfigFile = (configSourceCode)=>{
    if (!configSourceCode) {
        throw new Error('Cannot handle source code of mock-server.config.(ts|js)');
    }
    const mockServerConfigExports = (0, _resolveExportsFromSourceCode.resolveExportsFromSourceCode)(configSourceCode);
    const mockServerConfig = mockServerConfigExports.default;
    if (!mockServerConfig) {
        throw new Error('Cannot handle exports of mock-server.config.(ts|js)');
    }
    if (!(0, _helpers.isPlainObject)(mockServerConfig) && !Array.isArray(mockServerConfig)) {
        throw new Error('configuration should be plain object or array; see our doc (https://www.npmjs.com/package/mock-config-server) for more information');
    }
    return mockServerConfig;
};
