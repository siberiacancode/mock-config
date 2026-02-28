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
    get jsonLiteralSchema () {
        return jsonLiteralSchema;
    },
    get jsonSchema () {
        return jsonSchema;
    }
});
const _zod = require("zod");
const _helpers = require("../../../helpers");
const jsonLiteralSchema = _zod.z.union([
    _zod.z.string(),
    _zod.z.number(),
    _zod.z.boolean(),
    _zod.z.null()
]);
const jsonSchema = _zod.z.lazy(()=>_zod.z.union([
        jsonLiteralSchema,
        _zod.z.array(jsonSchema),
        // ✅ important:
        // using 'and' checking instead of 'plainObjectSchema' because of zod types peculiarities
        _zod.z.record(jsonSchema).and(_zod.z.custom((value)=>(0, _helpers.isPlainObject)(value)))
    ]));
