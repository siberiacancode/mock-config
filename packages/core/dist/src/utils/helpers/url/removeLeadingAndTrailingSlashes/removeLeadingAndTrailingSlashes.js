"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "removeLeadingAndTrailingSlashes", {
    enumerable: true,
    get: function() {
        return removeLeadingAndTrailingSlashes;
    }
});
const removeLeadingAndTrailingSlashes = (string)=>string.replace(/^\/+|\/+$/g, '');
