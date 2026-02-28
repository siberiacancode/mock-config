"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveExportsFromSourceCode", {
    enumerable: true,
    get: function() {
        return resolveExportsFromSourceCode;
    }
});
const resolveExportsFromSourceCode = (sourceCode)=>{
    // @ts-expect-error: module is constructed
    const moduleInstance = new module.constructor();
    moduleInstance._compile(sourceCode, '');
    return moduleInstance.exports;
};
