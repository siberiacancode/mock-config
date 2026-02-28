"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "cookieParseMiddleware", {
    enumerable: true,
    get: function() {
        return cookieParseMiddleware;
    }
});
const _helpers = require("./helpers");
const cookieParseMiddleware = (server)=>{
    server.use((request, _response, next)=>{
        if (request.headers.cookie) {
            request.cookies = (0, _helpers.parseCookie)(request.headers.cookie);
        } else {
            request.cookies = {};
        }
        return next();
    });
};
