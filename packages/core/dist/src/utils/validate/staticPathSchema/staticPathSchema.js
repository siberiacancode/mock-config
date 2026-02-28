"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "staticPathSchema", {
    enumerable: true,
    get: function() {
        return staticPathSchema;
    }
});
const _zod = require("zod");
const _utils = require("../utils");
const staticPathObjectSchema = _zod.z.strictObject({
    prefix: _utils.stringForwardSlashSchema,
    path: _utils.stringForwardSlashSchema
});
const staticPathStringOrObjectSchema = _zod.z.union([
    _utils.stringForwardSlashSchema,
    staticPathObjectSchema
]);
const staticPathSchema = _zod.z.union([
    staticPathStringOrObjectSchema,
    _zod.z.array(staticPathStringOrObjectSchema)
]);
