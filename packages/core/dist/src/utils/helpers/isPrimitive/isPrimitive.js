"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "isPrimitive", {
    enumerable: true,
    get: function() {
        return isPrimitive;
    }
});
const isPrimitive = (value)=>value !== Object(value);
