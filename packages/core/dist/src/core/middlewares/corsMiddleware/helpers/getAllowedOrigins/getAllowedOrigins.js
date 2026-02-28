"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "getAllowedOrigins", {
    enumerable: true,
    get: function() {
        return getAllowedOrigins;
    }
});
const getAllowedOrigins = (origin)=>{
    if (Array.isArray(origin)) {
        return origin;
    }
    if (typeof origin === 'string' || origin instanceof RegExp) {
        return [
            origin
        ];
    }
    throw new Error('Invalid cors origin format');
};
