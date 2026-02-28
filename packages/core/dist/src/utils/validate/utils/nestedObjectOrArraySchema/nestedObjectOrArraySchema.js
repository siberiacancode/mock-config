"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "nestedObjectOrArraySchema", {
    enumerable: true,
    get: function() {
        return nestedObjectOrArraySchema;
    }
});
const _zod = require("zod");
const _helpers = require("../../../helpers");
const nestedObjectOrArraySchema = (valueSchema)=>{
    const nestedValueSchema = _zod.z.union([
        valueSchema,
        _zod.z.lazy(()=>nestedObjectOrArraySchema(valueSchema))
    ]);
    return _zod.z.union([
        _zod.z.array(nestedValueSchema),
        _zod.z.record(nestedValueSchema).and(_zod.z.custom((value)=>(0, _helpers.isPlainObject)(value)))
    ]);
};
