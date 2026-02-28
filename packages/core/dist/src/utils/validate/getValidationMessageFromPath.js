"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "getValidationMessageFromPath", {
    enumerable: true,
    get: function() {
        return getValidationMessageFromPath;
    }
});
const getValidationMessageFromPath = (path)=>path.reduce((validationMessageAcc, pathElement)=>{
        if (typeof pathElement === 'number') return `${validationMessageAcc}[${pathElement}]`;
        return `${validationMessageAcc}.${pathElement}`;
    }, '');
