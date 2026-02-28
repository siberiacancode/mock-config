"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "asyncHandler", {
    enumerable: true,
    get: function() {
        return asyncHandler;
    }
});
const asyncHandler = (fn)=>(request, response, next)=>Promise.resolve(fn(request, response, next)).catch(next);
