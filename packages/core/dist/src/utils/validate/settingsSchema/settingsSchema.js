"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "settingsSchema", {
    enumerable: true,
    get: function() {
        return settingsSchema;
    }
});
const _zod = require("zod");
const settingsSchema = _zod.z.strictObject({
    polling: _zod.z.boolean().optional(),
    status: _zod.z.number().min(200).max(599).optional(),
    delay: _zod.z.number().nonnegative().optional()
});
