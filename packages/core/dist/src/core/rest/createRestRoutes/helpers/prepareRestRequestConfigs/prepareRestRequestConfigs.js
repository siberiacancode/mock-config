"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "prepareRestRequestConfigs", {
    enumerable: true,
    get: function() {
        return prepareRestRequestConfigs;
    }
});
const _helpers = require("../../../../../utils/helpers");
const calculateRouteConfigWeight = (restRouteConfig)=>{
    const { entities } = restRouteConfig;
    if (!entities) return 0;
    let routeConfigWeight = 0;
    const { headers, cookies, query, params, body } = entities;
    if (headers) routeConfigWeight += Object.keys(headers).length;
    if (cookies) routeConfigWeight += Object.keys(cookies).length;
    if (query) routeConfigWeight += Object.keys(query).length;
    if (params) routeConfigWeight += Object.keys(params).length;
    if (body) {
        if ((0, _helpers.isPlainObject)(body) && body.checkMode) {
            // ✅ important:
            // check that actual value check modes does not have `value` for compare
            if (body.checkMode === 'exists' || body.checkMode === 'notExists') {
                routeConfigWeight += 1;
                return routeConfigWeight;
            }
            routeConfigWeight += (0, _helpers.isPlainObject)(body.value) ? Object.keys(body.value).length : 1;
            return routeConfigWeight;
        }
        routeConfigWeight += (0, _helpers.isPlainObject)(body) ? Object.keys(body).length : 1;
    }
    return routeConfigWeight;
};
const prepareRestRequestConfigs = (requestConfigs)=>{
    const sortedByPathRequestConfigs = requestConfigs.sort(({ path: firstPath }, { path: secondPath })=>{
        // ✅ important:
        // do not compare RegExp paths and non-parameterized paths
        if (firstPath instanceof RegExp || secondPath instanceof RegExp) return 0;
        if (!firstPath.includes('/:') && !secondPath.includes('/:')) return 0;
        const firstPathParts = firstPath.split('/');
        const secondPathParts = secondPath.split('/');
        const minimalPathPartsLength = Math.min(firstPathParts.length, secondPathParts.length);
        // ✅ important:
        // need to find the leftmost parameter/non-parameter pair and give priority to non-parameter one
        for(let i = 0; i < minimalPathPartsLength; i += 1){
            const firstPathPart = firstPathParts[i];
            const secondPathPart = secondPathParts[i];
            const isFirstPathPartParameter = firstPathPart.startsWith(':');
            const isSecondPathPartParameter = secondPathPart.startsWith(':');
            if (!isFirstPathPartParameter && !isSecondPathPartParameter) {
                if (firstPathPart === secondPathPart) continue;
                return 0;
            }
            if (isFirstPathPartParameter && isSecondPathPartParameter) continue;
            return +isFirstPathPartParameter - +isSecondPathPartParameter;
        }
        return 0;
    });
    sortedByPathRequestConfigs.forEach((requestConfig)=>{
        requestConfig.routes.sort((first, second)=>// ✅ important:
            // Lift more specific configs for correct working of routes
            calculateRouteConfigWeight(second) - calculateRouteConfigWeight(first));
    });
    return requestConfigs;
};
