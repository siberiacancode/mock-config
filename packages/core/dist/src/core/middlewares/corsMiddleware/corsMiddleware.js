"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "corsMiddleware", {
    enumerable: true,
    get: function() {
        return corsMiddleware;
    }
});
const _constants = require("../../../utils/constants");
const _helpers = require("../../../utils/helpers");
const _helpers1 = require("./helpers");
const corsMiddleware = (server, cors)=>{
    server.use((0, _helpers.asyncHandler)(async (request, response, next)=>{
        if (Array.isArray(cors.origin) && !cors.origin.length) {
            return next();
        }
        let allowedOrigins = [];
        if (typeof cors.origin === 'function') {
            const origins = await cors.origin(request);
            allowedOrigins = (0, _helpers1.getAllowedOrigins)(origins);
        } else {
            allowedOrigins = (0, _helpers1.getAllowedOrigins)(cors.origin);
        }
        const { origin } = request.headers;
        if (!(allowedOrigins === null || allowedOrigins === void 0 ? void 0 : allowedOrigins.length) || !origin) {
            return next();
        }
        const isRequestOriginAllowed = allowedOrigins.some((allowedOrigin)=>{
            if (allowedOrigin instanceof RegExp) {
                return new RegExp(allowedOrigin).test(origin);
            }
            return allowedOrigin === origin;
        });
        if (isRequestOriginAllowed) {
            response.setHeader('Access-Control-Allow-Origin', origin);
            var _cors_credentials;
            response.setHeader('Access-Control-Allow-Credentials', `${(_cors_credentials = cors.credentials) !== null && _cors_credentials !== void 0 ? _cors_credentials : _constants.DEFAULT.CORS.CREDENTIALS}`);
            var _cors_exposedHeaders;
            response.setHeader('Access-Control-Expose-Headers', (_cors_exposedHeaders = cors.exposedHeaders) !== null && _cors_exposedHeaders !== void 0 ? _cors_exposedHeaders : _constants.DEFAULT.CORS.EXPOSED_HEADERS);
            if (request.method === 'OPTIONS') {
                var _cors_methods;
                response.setHeader('Access-Control-Allow-Methods', (_cors_methods = cors.methods) !== null && _cors_methods !== void 0 ? _cors_methods : _constants.DEFAULT.CORS.METHODS);
                var _cors_allowedHeaders;
                response.setHeader('Access-Control-Allow-Headers', (_cors_allowedHeaders = cors.allowedHeaders) !== null && _cors_allowedHeaders !== void 0 ? _cors_allowedHeaders : _constants.DEFAULT.CORS.ALLOWED_HEADERS);
                var _cors_maxAge;
                response.setHeader('Access-Control-Max-Age', (_cors_maxAge = cors.maxAge) !== null && _cors_maxAge !== void 0 ? _cors_maxAge : _constants.DEFAULT.CORS.MAX_AGE);
                response.sendStatus(204);
                return response.end();
            }
        }
        return next();
    }));
};
