"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "callResponseInterceptors", {
    enumerable: true,
    get: function() {
        return callResponseInterceptors;
    }
});
const _logger = require("../../logger");
const _setDelay = require("../helpers/setDelay");
const callResponseInterceptors = async (params)=>{
    const { data, request, response, interceptors } = params;
    const getRequestHeader = (field)=>request.headers[field];
    const getRequestHeaders = ()=>request.headers;
    const getResponseHeader = (field)=>response.getHeader(field);
    const getResponseHeaders = ()=>response.getHeaders();
    const setHeader = (field, value)=>{
        response.set(field, value);
    };
    const appendHeader = (field, value)=>{
        response.append(field, value);
    };
    const setStatusCode = (statusCode)=>{
        response.statusCode = statusCode;
    };
    const getCookie = (name)=>request.cookies[name];
    const setCookie = (name, value, options)=>{
        if (options) {
            response.cookie(name, value, options);
            return;
        }
        response.cookie(name, value);
    };
    const clearCookie = (name, options)=>{
        response.clearCookie(name, options);
    };
    const attachment = (filename)=>{
        response.attachment(filename);
    };
    const log = (logger)=>(0, _logger.callResponseLogger)({
            logger,
            data,
            request,
            response
        });
    const responseInterceptorParams = {
        request,
        response,
        setDelay: _setDelay.setDelay,
        setStatusCode,
        setHeader,
        appendHeader,
        getRequestHeader,
        getRequestHeaders,
        getResponseHeader,
        getResponseHeaders,
        setCookie,
        getCookie,
        clearCookie,
        attachment,
        log,
        orm: request.context.orm
    };
    let updatedData = data;
    if (interceptors === null || interceptors === void 0 ? void 0 : interceptors.routeInterceptor) {
        updatedData = await interceptors.routeInterceptor(updatedData, responseInterceptorParams);
    }
    if (interceptors === null || interceptors === void 0 ? void 0 : interceptors.requestInterceptor) {
        updatedData = await interceptors.requestInterceptor(updatedData, responseInterceptorParams);
    }
    if (interceptors === null || interceptors === void 0 ? void 0 : interceptors.apiInterceptor) {
        updatedData = await interceptors.apiInterceptor(updatedData, responseInterceptorParams);
    }
    if (interceptors === null || interceptors === void 0 ? void 0 : interceptors.serverInterceptor) {
        updatedData = await interceptors.serverInterceptor(updatedData, responseInterceptorParams);
    }
    return updatedData;
};
