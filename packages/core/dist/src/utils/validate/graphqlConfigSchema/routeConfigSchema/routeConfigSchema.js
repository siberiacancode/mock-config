"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "routeConfigSchema", {
    enumerable: true,
    get: function() {
        return routeConfigSchema;
    }
});
const _zod = require("zod");
const _helpers = require("../../../helpers");
const _interceptorsSchema = require("../../interceptorsSchema/interceptorsSchema");
const _isOnlyRequestedDataResolvingPropertyExists = require("../../isOnlyRequestedDataResolvingPropertyExists");
const _queueSchema = require("../../queueSchema/queueSchema");
const _settingsSchema = require("../../settingsSchema/settingsSchema");
const _utils = require("../../utils");
const baseRouteConfigSchema = _zod.z.strictObject({
    entities: (0, _utils.plainObjectSchema)(_zod.z.strictObject({
        headers: _utils.mappedEntitySchema.optional(),
        cookies: _utils.mappedEntitySchema.optional(),
        query: _utils.mappedEntitySchema.optional(),
        variables: _utils.variablesPlainEntitySchema.optional()
    })).optional(),
    interceptors: (0, _utils.plainObjectSchema)(_interceptorsSchema.interceptorsSchema).optional()
});
const dataRouteConfigSchema = _zod.z.strictObject({
    settings: (0, _utils.plainObjectSchema)(_settingsSchema.settingsSchema.extend({
        polling: _zod.z.literal(false).optional()
    })).optional(),
    data: _zod.z.union([
        _zod.z.function(),
        _zod.z.any()
    ])
}).merge(baseRouteConfigSchema);
const queueRouteConfigSchema = _zod.z.strictObject({
    settings: _settingsSchema.settingsSchema.extend({
        polling: _zod.z.literal(true)
    }),
    queue: _queueSchema.queueSchema
}).merge(baseRouteConfigSchema);
const routeConfigSchema = _zod.z.union([
    _zod.z.custom((value)=>(0, _helpers.isPlainObject)(value) && (0, _isOnlyRequestedDataResolvingPropertyExists.isOnlyRequestedDataResolvingPropertyExists)(value, 'data')).pipe(dataRouteConfigSchema),
    _zod.z.custom((value)=>(0, _helpers.isPlainObject)(value) && (0, _isOnlyRequestedDataResolvingPropertyExists.isOnlyRequestedDataResolvingPropertyExists)(value, 'queue')).pipe(queueRouteConfigSchema)
]);
