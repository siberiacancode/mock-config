"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "prepareGraphQLRequestConfigs", {
    enumerable: true,
    get: function() {
        return prepareGraphQLRequestConfigs;
    }
});
const _helpers = require("../../../../../utils/helpers");
const calculateRouteConfigWeight = (graphQLRouteConfig)=>{
    const { entities } = graphQLRouteConfig;
    if (!entities) return 0;
    let routeConfigWeight = 0;
    const { headers, cookies, query, variables } = entities;
    if (headers) routeConfigWeight += Object.keys(headers).length;
    if (cookies) routeConfigWeight += Object.keys(cookies).length;
    if (query) routeConfigWeight += Object.keys(query).length;
    if (variables) {
        if (variables.checkMode) {
            // ✅ important:
            // check that actual value check modes does not have `value` for compare
            if (variables.checkMode === 'exists' || variables.checkMode === 'notExists') {
                routeConfigWeight += 1;
                return routeConfigWeight;
            }
            routeConfigWeight += (0, _helpers.isPlainObject)(variables.value) ? Object.keys(variables.value).length : 1;
            return routeConfigWeight;
        }
        routeConfigWeight += Object.keys(variables).length;
    }
    return routeConfigWeight;
};
const prepareGraphQLRequestConfigs = (requestConfigs)=>{
    requestConfigs.forEach((requestConfig)=>{
        requestConfig.routes.sort((first, second)=>// ✅ important:
            // Lift more specific configs for correct working of routes
            calculateRouteConfigWeight(second) - calculateRouteConfigWeight(first));
    });
    return requestConfigs;
};
