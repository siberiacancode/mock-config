"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "isIndex", {
    enumerable: true,
    get: function() {
        return isIndex;
    }
});
const isIndex = (value)=>Number.isInteger(value) && value >= 0;
