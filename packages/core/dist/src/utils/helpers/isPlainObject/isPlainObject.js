"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "isPlainObject", {
    enumerable: true,
    get: function() {
        return isPlainObject;
    }
});
const isPlainObject = (value)=>typeof value === 'object' && !Array.isArray(value) && value !== null && !(value instanceof RegExp);
