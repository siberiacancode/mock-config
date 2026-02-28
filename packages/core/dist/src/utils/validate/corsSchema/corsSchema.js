"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "corsSchema", {
    enumerable: true,
    get: function() {
        return corsSchema;
    }
});
const _zod = require("zod");
const stringOrRegExpSchema = _zod.z.union([
    _zod.z.string(),
    _zod.z.instanceof(RegExp)
]);
const originSchema = _zod.z.union([
    stringOrRegExpSchema,
    _zod.z.array(stringOrRegExpSchema),
    _zod.z.function()
]);
const corsSchema = _zod.z.strictObject({
    origin: originSchema,
    methods: _zod.z.array(_zod.z.enum([
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'PATCH',
        'OPTIONS'
    ])).optional(),
    allowedHeaders: _zod.z.array(_zod.z.string()).optional(),
    exposedHeaders: _zod.z.array(_zod.z.string()).optional(),
    credentials: _zod.z.boolean().optional(),
    maxAge: _zod.z.number().int().positive().optional()
});
