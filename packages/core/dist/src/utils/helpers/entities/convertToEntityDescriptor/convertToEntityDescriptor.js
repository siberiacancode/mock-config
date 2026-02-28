"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "convertToEntityDescriptor", {
    enumerable: true,
    get: function() {
        return convertToEntityDescriptor;
    }
});
const _isEntityDescriptor = require("../isEntityDescriptor/isEntityDescriptor");
const convertToEntityDescriptor = (valueOrDescriptor)=>(0, _isEntityDescriptor.isEntityDescriptor)(valueOrDescriptor) ? valueOrDescriptor : {
        checkMode: 'equals',
        value: valueOrDescriptor
    };
