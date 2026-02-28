"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "queueSchema", {
    enumerable: true,
    get: function() {
        return queueSchema;
    }
});
const _zod = require("zod");
const queueSchema = _zod.z.array(_zod.z.union([
    _zod.z.custom((value)=>'data' in value).pipe(_zod.z.strictObject({
        time: _zod.z.number().int().nonnegative().optional(),
        data: _zod.z.union([
            _zod.z.function(),
            _zod.z.any()
        ])
    })),
    _zod.z.strictObject({
        time: _zod.z.number().int().nonnegative().optional(),
        file: _zod.z.string()
    })
]));
