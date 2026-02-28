"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "callRequestInterceptor", {
    enumerable: true,
    get: function() {
        return callRequestInterceptor;
    }
});
const _logger = require("../../logger");
const _setDelay = require("../helpers/setDelay");
const callRequestInterceptor = async (params)=>{
    const { request, interceptor } = params;
    const getHeader = (field)=>request.headers[field];
    const getHeaders = ()=>request.headers;
    const getCookie = (name)=>request.cookies[name];
    const log = (logger)=>(0, _logger.callRequestLogger)({
            logger,
            request
        });
    const requestInterceptorParams = {
        request,
        setDelay: _setDelay.setDelay,
        getHeader,
        getHeaders,
        getCookie,
        log,
        orm: request.context.orm
    };
    await interceptor(requestInterceptorParams);
};
