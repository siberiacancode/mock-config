"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "getUrlParts", {
    enumerable: true,
    get: function() {
        return getUrlParts;
    }
});
const _removeLeadingAndTrailingSlashes = require("../removeLeadingAndTrailingSlashes/removeLeadingAndTrailingSlashes");
const getUrlParts = (url)=>(0, _removeLeadingAndTrailingSlashes.removeLeadingAndTrailingSlashes)(url).split('/');
