"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "databaseConfigSchema", {
    enumerable: true,
    get: function() {
        return databaseConfigSchema;
    }
});
const _zod = require("zod");
const _utils = require("../utils");
const databaseConfigSchema = _zod.z.strictObject({
    data: _zod.z.union([
        (0, _utils.plainObjectSchema)(_zod.z.record(_zod.z.unknown())),
        _utils.stringJsonFilenameSchema
    ]),
    routes: _zod.z.union([
        (0, _utils.plainObjectSchema)(_zod.z.record(_utils.stringForwardSlashSchema, _utils.stringForwardSlashSchema)),
        _utils.stringJsonFilenameSchema
    ]).optional()
});
