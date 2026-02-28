"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "plainObjectSchema", {
    enumerable: true,
    get: function() {
        return plainObjectSchema;
    }
});
const _zod = require("zod");
const plainObjectSchema = (schema)=>_zod.z.custom((value)=>!(value instanceof RegExp)).pipe(schema);
