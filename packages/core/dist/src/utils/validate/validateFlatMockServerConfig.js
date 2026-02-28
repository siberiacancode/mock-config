"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "validateFlatMockServerConfig", {
    enumerable: true,
    get: function() {
        return validateFlatMockServerConfig;
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
const validateFlatMockServerConfig = (flatMockServerConfig)=>{
    if (!flatMockServerConfig.length) {
        throw new Error('Flat config should contain at least one element; see our doc (https://github.com/siberiacancode/mock-config-server) for more information');
    }
    const flatMockServerSettingsSchema = _zod.z.strictObject({
        baseUrl: _baseUrlSchema.baseUrlSchema.optional(),
        port: _portSchema.portSchema.optional(),
        staticPath: _staticPathSchema.staticPathSchema.optional(),
        interceptors: (0, _utils.plainObjectSchema)(_interceptorsSchema.interceptorsSchema).optional(),
        cors: _corsSchema.corsSchema.optional(),
        database: _databaseConfigSchema.databaseConfigSchema.optional()
    });
    const flatMockServerComponentSchema = _zod.z.strictObject({
        name: _zod.z.string().optional(),
        baseUrl: _baseUrlSchema.baseUrlSchema.optional(),
        interceptors: (0, _utils.plainObjectSchema)(_interceptorsSchema.interceptorsSchema).optional(),
        configs: _zod.z.array(_zod.z.union([
            _restConfigSchema.restRequestConfigSchema,
            _graphqlConfigSchema.graphqlRequestConfigSchema
        ]))
    });
    const flatMockServerConfigSchema = _zod.z.tuple([
        (0, _utils.plainObjectSchema)(flatMockServerSettingsSchema).or(flatMockServerComponentSchema)
    ]).rest(flatMockServerComponentSchema);
    const validationFlatMockServerConfigSchemaResult = flatMockServerConfigSchema.safeParse(flatMockServerConfig);
    if (!validationFlatMockServerConfigSchemaResult.success) {
        const path = (0, _getMostSpecificPathFromError.getMostSpecificPathFromError)(validationFlatMockServerConfigSchemaResult.error);
        const validationMessage = (0, _getValidationMessageFromPath.getValidationMessageFromPath)(path);
        throw new Error(`Validation Error: configuration${validationMessage} does not match the API schema. Click here to see correct type: https://github.com/siberiacancode/mock-config-server`);
    }
};
