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
    get restConfigSchema () {
        return restConfigSchema;
    },
    get restRequestConfigSchema () {
        return restRequestConfigSchema;
    }
});
const _zod = require("zod");
const _baseUrlSchema = require("../baseUrlSchema/baseUrlSchema");
const _interceptorsSchema = require("../interceptorsSchema/interceptorsSchema");
const _utils = require("../utils");
const _routeConfigSchema = require("./routeConfigSchema/routeConfigSchema");
const baseRequestConfigSchema = (method)=>_zod.z.strictObject({
        path: _zod.z.union([
            _utils.stringForwardSlashSchema,
            _zod.z.instanceof(RegExp)
        ]),
        method: _zod.z.literal(method),
        routes: _zod.z.array((0, _routeConfigSchema.routeConfigSchema)(method)),
        interceptors: (0, _utils.plainObjectSchema)(_interceptorsSchema.interceptorsSchema).optional()
    });
const restRequestConfigSchema = _zod.z.union([
    baseRequestConfigSchema('get'),
    baseRequestConfigSchema('post'),
    baseRequestConfigSchema('put'),
    baseRequestConfigSchema('delete'),
    baseRequestConfigSchema('patch'),
    baseRequestConfigSchema('options')
]);
const restConfigSchema = _zod.z.strictObject({
    baseUrl: _baseUrlSchema.baseUrlSchema.optional(),
    configs: _zod.z.array(restRequestConfigSchema),
    interceptors: (0, _utils.plainObjectSchema)(_interceptorsSchema.interceptorsSchema).optional()
});
