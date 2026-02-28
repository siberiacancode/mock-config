"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "isOnlyRequestedDataResolvingPropertyExists", {
    enumerable: true,
    get: function() {
        return isOnlyRequestedDataResolvingPropertyExists;
    }
});
const DATA_RESOLVING_PROPERTIES = [
    'data',
    'file',
    'queue'
];
const isOnlyRequestedDataResolvingPropertyExists = (object, requestedDataResolvingProperty)=>DATA_RESOLVING_PROPERTIES.every((dataResolvingProperty)=>dataResolvingProperty === requestedDataResolvingProperty ? dataResolvingProperty in object : !(dataResolvingProperty in object));
