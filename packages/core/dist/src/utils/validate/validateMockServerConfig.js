"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "validateMockServerConfig", {
    enumerable: true,
    get: function() {
        return validateMockServerConfig;
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
const validateMockServerConfig = (mockServerConfig)=>{
    if (!mockServerConfig.rest && !mockServerConfig.graphql && !mockServerConfig.database && !mockServerConfig.staticPath) {
        throw new Error('Configuration should contain at least one of these configs: rest | graphql | database | staticPath; see our doc (https://github.com/siberiacancode/mock-config-server) for more information');
    }
    const mockServerConfigSchema = _zod.z.strictObject({
        baseUrl: _baseUrlSchema.baseUrlSchema.optional(),
        port: _portSchema.portSchema.optional(),
        staticPath: _staticPathSchema.staticPathSchema.optional(),
        interceptors: (0, _utils.plainObjectSchema)(_interceptorsSchema.interceptorsSchema).optional(),
        cors: _corsSchema.corsSchema.optional(),
        rest: _restConfigSchema.restConfigSchema.optional(),
        graphql: _graphqlConfigSchema.graphqlConfigSchema.optional(),
        database: _databaseConfigSchema.databaseConfigSchema.optional()
    });
    const validationResult = mockServerConfigSchema.safeParse(mockServerConfig);
    if (!validationResult.success) {
        const path = (0, _getMostSpecificPathFromError.getMostSpecificPathFromError)(validationResult.error);
        const validationMessage = (0, _getValidationMessageFromPath.getValidationMessageFromPath)(path);
        throw new Error(`Validation Error: configuration${validationMessage} does not match the API schema. Click here to see correct type: https://github.com/siberiacancode/mock-config-server`);
    }
};
