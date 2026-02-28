"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "validateApiMockServerConfig", {
    enumerable: true,
    get: function() {
        return validateApiMockServerConfig;
    }
});
const _zod = require("zod");
const _baseUrlSchema = require("./baseUrlSchema/baseUrlSchema");
const _corsSchema = require("./corsSchema/corsSchema");
const _databaseConfigSchema = require("./databaseConfigSchema/databaseConfigSchema");
const _getMostSpecificPathFromError = require("./getMostSpecificPathFromError");
const _getValidationMessageFromPath = require("./getValidationMessageFromPath");
const _graphqlConfigSchema = require("./graphqlConfigSchema/graphqlConfigSchema");
const _interceptorsSchema = require("./interceptorsSchema/interceptorsSchema");
const _portSchema = require("./portSchema/portSchema");
const _restConfigSchema = require("./restConfigSchema/restConfigSchema");
const _staticPathSchema = require("./staticPathSchema/staticPathSchema");
const _utils = require("./utils");
const validateApiMockServerConfig = (mockServerConfig, api)=>{
    if (!mockServerConfig.configs && !mockServerConfig.database && !mockServerConfig.staticPath) {
        throw new Error('Configuration should contain at least one of these configs: configs | database | staticPath; see our doc (https://github.com/siberiacancode/mock-config-server) for more information');
    }
    const isConfigsContainAtLeastOneElement = Array.isArray(mockServerConfig.configs) && !!mockServerConfig.configs.length;
    const mockServerConfigSchema = _zod.z.strictObject({
        baseUrl: _baseUrlSchema.baseUrlSchema.optional(),
        port: _portSchema.portSchema.optional(),
        staticPath: _staticPathSchema.staticPathSchema.optional(),
        interceptors: (0, _utils.plainObjectSchema)(_interceptorsSchema.interceptorsSchema).optional(),
        cors: _corsSchema.corsSchema.optional(),
        database: _databaseConfigSchema.databaseConfigSchema.optional(),
        ...isConfigsContainAtLeastOneElement && api === 'graphql' && {
            configs: _graphqlConfigSchema.graphqlConfigSchema.shape.configs
        },
        ...isConfigsContainAtLeastOneElement && api === 'rest' && {
            configs: _restConfigSchema.restConfigSchema.shape.configs
        }
    });
    const validationResult = mockServerConfigSchema.safeParse(mockServerConfig);
    if (!validationResult.success) {
        const path = (0, _getMostSpecificPathFromError.getMostSpecificPathFromError)(validationResult.error);
        const validationMessage = (0, _getValidationMessageFromPath.getValidationMessageFromPath)(path);
        throw new Error(`Validation Error: configuration${validationMessage} does not match the API schema. Click here to see correct type: https://github.com/siberiacancode/mock-config-server`);
    }
};
