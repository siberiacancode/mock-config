"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "interceptorsSchema", {
    enumerable: true,
    get: function() {
        return interceptorsSchema;
    }
});
const _zod = require("zod");
const interceptorsSchema = _zod.z.strictObject({
    request: _zod.z.function().optional(),
    response: _zod.z.function().optional()
});
