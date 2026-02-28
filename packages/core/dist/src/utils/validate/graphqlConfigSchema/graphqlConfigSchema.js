"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get graphqlConfigSchema () {
        return graphqlConfigSchema;
    },
    get graphqlRequestConfigSchema () {
        return graphqlRequestConfigSchema;
    }
});
const _zod = require("zod");
const _helpers = require("../../helpers");
const _baseUrlSchema = require("../baseUrlSchema/baseUrlSchema");
const _interceptorsSchema = require("../interceptorsSchema/interceptorsSchema");
const _utils = require("../utils");
const _routeConfigSchema = require("./routeConfigSchema/routeConfigSchema");
const baseRequestConfigSchema = _zod.z.strictObject({
    operationType: _zod.z.enum([
        'query',
        'mutation'
    ]),
    routes: _zod.z.array(_routeConfigSchema.routeConfigSchema),
    interceptors: (0, _utils.plainObjectSchema)(_interceptorsSchema.interceptorsSchema).optional()
});
const operationNameRequestConfigSchema = _zod.z.strictObject({
    operationName: _zod.z.union([
        _zod.z.string(),
        _zod.z.instanceof(RegExp)
    ]),
    query: _zod.z.string().optional()
}).merge(baseRequestConfigSchema);
const queryRequestConfigSchema = _zod.z.strictObject({
    operationName: _zod.z.union([
        _zod.z.string(),
        _zod.z.instanceof(RegExp)
    ]).optional(),
    query: _zod.z.string()
}).merge(baseRequestConfigSchema);
const graphqlRequestConfigSchema = _zod.z.union([
    _zod.z.custom((value)=>(0, _helpers.isPlainObject)(value) && 'operationName' in value).pipe(operationNameRequestConfigSchema),
    _zod.z.custom((value)=>(0, _helpers.isPlainObject)(value) && 'query' in value).pipe(queryRequestConfigSchema)
]);
const graphqlConfigSchema = _zod.z.strictObject({
    baseUrl: _baseUrlSchema.baseUrlSchema.optional(),
    configs: _zod.z.array(graphqlRequestConfigSchema),
    interceptors: (0, _utils.plainObjectSchema)(_interceptorsSchema.interceptorsSchema).optional()
});
