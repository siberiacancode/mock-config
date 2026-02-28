"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "noCorsMiddleware", {
    enumerable: true,
    get: function() {
        return noCorsMiddleware;
    }
});
const _constants = require("../../../utils/constants");
const noCorsMiddleware = (server)=>{
    server.use((request, response, next)=>{
        response.setHeader('Access-Control-Allow-Origin', _constants.DEFAULT.CORS.ORIGIN);
        response.setHeader('Access-Control-Allow-Credentials', `${_constants.DEFAULT.CORS.CREDENTIALS}`);
        response.setHeader('Access-Control-Expose-Headers', _constants.DEFAULT.CORS.EXPOSED_HEADERS);
        const isPreflightRequest = request.method === 'OPTIONS' && request.headers.origin && request.headers['access-control-request-method'] && request.headers['access-control-request-headers'];
        if (isPreflightRequest) {
            response.setHeader('Access-Control-Allow-Methods', _constants.DEFAULT.CORS.METHODS);
            response.setHeader('Access-Control-Allow-Headers', _constants.DEFAULT.CORS.ALLOWED_HEADERS);
            response.setHeader('Access-Control-Max-Age', _constants.DEFAULT.CORS.MAX_AGE);
            response.sendStatus(204);
            return response.end();
        }
        return next();
    });
};
