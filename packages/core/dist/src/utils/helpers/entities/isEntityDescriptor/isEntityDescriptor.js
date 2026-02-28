"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "isEntityDescriptor", {
    enumerable: true,
    get: function() {
        return isEntityDescriptor;
    }
});
const _isPlainObject = require("../../isPlainObject/isPlainObject");
const isEntityDescriptor = (value)=>(0, _isPlainObject.isPlainObject)(value) && 'checkMode' in value;
