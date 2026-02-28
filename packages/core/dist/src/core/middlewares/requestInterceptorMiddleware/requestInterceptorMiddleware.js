"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "requestInterceptorMiddleware", {
    enumerable: true,
    get: function() {
        return requestInterceptorMiddleware;
    }
});
const _helpers = require("../../../utils/helpers");
const requestInterceptorMiddleware = ({ server, path = '*', interceptor })=>{
    server.use(path, (0, _helpers.asyncHandler)(async (request, _response, next)=>{
        await (0, _helpers.callRequestInterceptor)({
            request,
            interceptor
        });
        return next();
    }));
};
