"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "requiredPropertiesSchema", {
    enumerable: true,
    get: function() {
        return requiredPropertiesSchema;
    }
});
const _zod = require("zod");
const _helpers = require("../../../helpers");
const requiredPropertiesSchema = (schema, requiredProperties)=>_zod.z.custom((value)=>(0, _helpers.isPlainObject)(value) && requiredProperties.every((property)=>Object.prototype.hasOwnProperty.call(value, property))).pipe(schema);
