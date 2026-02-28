"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createGraphQLRoutes", {
    enumerable: true,
    get: function() {
        return createGraphQLRoutes;
    }
});
const _flat = require("flat");
const _helpers = require("../../../utils/helpers");
const _helpers1 = require("./helpers");
const createGraphQLRoutes = ({ router, graphqlConfig, serverResponseInterceptor })=>{
    const preparedGraphQLRequestConfig = (0, _helpers1.prepareGraphQLRequestConfigs)(graphqlConfig.configs);
    const graphqlMiddleware = async (request, response, next)=>{
        var _matchedRequestConfig_interceptors, _matchedRouteConfig_interceptors, _matchedRouteConfig_settings, _matchedRouteConfig_settings1, _matchedRouteConfig_interceptors1, _matchedRequestConfig_interceptors1, _graphqlConfig_interceptors, _matchedRouteConfig_settings2;
        const graphQLInput = (0, _helpers.getGraphQLInput)(request);
        if (!graphQLInput.query) {
            return response.status(400).json({
                message: 'Query is missing, you must pass a valid GraphQL query'
            });
        }
        const query = (0, _helpers.parseQuery)(graphQLInput.query);
        if (!query) {
            return response.status(400).json({
                message: 'Query is invalid, you must use a valid GraphQL query'
            });
        }
        const matchedRequestConfig = preparedGraphQLRequestConfig.find((requestConfig)=>{
            var _graphQLInput_query;
            if (requestConfig.operationType !== query.operationType) return false;
            if ('query' in requestConfig && requestConfig.query.replace(/\s+/g, '') !== ((_graphQLInput_query = graphQLInput.query) === null || _graphQLInput_query === void 0 ? void 0 : _graphQLInput_query.replace(/\s+/g, ''))) return false;
            if ('operationName' in requestConfig) {
                if (!query.operationName) return false;
                return requestConfig.operationName instanceof RegExp ? new RegExp(requestConfig.operationName).test(query.operationName) : requestConfig.operationName === query.operationName;
            }
            return true;
        });
        if (!matchedRequestConfig) {
            return next();
        }
        if ((_matchedRequestConfig_interceptors = matchedRequestConfig.interceptors) === null || _matchedRequestConfig_interceptors === void 0 ? void 0 : _matchedRequestConfig_interceptors.request) {
            await (0, _helpers.callRequestInterceptor)({
                request,
                interceptor: matchedRequestConfig.interceptors.request
            });
        }
        const matchedRouteConfig = matchedRequestConfig.routes.find(({ entities })=>{
            if (!entities) return true;
            const entityEntries = Object.entries(entities);
            return entityEntries.every(([entityName, entityDescriptorOrValue])=>{
                // ✅ important:
                // check whole variables as plain value strictly if descriptor used for variables
                const isEntityVariablesByTopLevelDescriptor = entityName === 'variables' && (0, _helpers.isEntityDescriptor)(entityDescriptorOrValue);
                if (isEntityVariablesByTopLevelDescriptor) {
                    const variablesDescriptor = entityDescriptorOrValue;
                    if (variablesDescriptor.checkMode === 'exists' || variablesDescriptor.checkMode === 'notExists') {
                        return (0, _helpers.resolveEntityValues)({
                            actualValue: graphQLInput.variables,
                            checkMode: variablesDescriptor.checkMode
                        });
                    }
                    var _variablesDescriptor_oneOf;
                    return (0, _helpers.resolveEntityValues)({
                        actualValue: graphQLInput.variables,
                        descriptorValue: variablesDescriptor.value,
                        checkMode: variablesDescriptor.checkMode,
                        oneOf: (_variablesDescriptor_oneOf = variablesDescriptor.oneOf) !== null && _variablesDescriptor_oneOf !== void 0 ? _variablesDescriptor_oneOf : false
                    });
                }
                const actualEntity = (0, _flat.flatten)(entityName === 'variables' ? graphQLInput.variables : request[entityName]);
                const entityValueEntries = Object.entries(entityDescriptorOrValue);
                return entityValueEntries.every(([entityPropertyKey, entityPropertyDescriptorOrValue])=>{
                    const entityPropertyDescriptor = (0, _helpers.convertToEntityDescriptor)(entityPropertyDescriptorOrValue);
                    // ✅ important: transform header keys to lower case because browsers send headers in lowercase
                    const actualPropertyKey = entityName === 'headers' ? entityPropertyKey.toLowerCase() : entityPropertyKey;
                    const actualPropertyValue = actualEntity[actualPropertyKey];
                    if (entityPropertyDescriptor.checkMode === 'exists' || entityPropertyDescriptor.checkMode === 'notExists') {
                        return (0, _helpers.resolveEntityValues)({
                            actualValue: actualPropertyValue,
                            checkMode: entityPropertyDescriptor.checkMode
                        });
                    }
                    var _entityPropertyDescriptor_oneOf;
                    return (0, _helpers.resolveEntityValues)({
                        actualValue: actualPropertyValue,
                        descriptorValue: entityPropertyDescriptor.value,
                        checkMode: entityPropertyDescriptor.checkMode,
                        oneOf: (_entityPropertyDescriptor_oneOf = entityPropertyDescriptor.oneOf) !== null && _entityPropertyDescriptor_oneOf !== void 0 ? _entityPropertyDescriptor_oneOf : false
                    });
                });
            });
        });
        if (!matchedRouteConfig) return next();
        if ((_matchedRouteConfig_interceptors = matchedRouteConfig.interceptors) === null || _matchedRouteConfig_interceptors === void 0 ? void 0 : _matchedRouteConfig_interceptors.request) {
            await (0, _helpers.callRequestInterceptor)({
                request,
                interceptor: matchedRouteConfig.interceptors.request
            });
        }
        let matchedRouteConfigData = null;
        if (((_matchedRouteConfig_settings = matchedRouteConfig.settings) === null || _matchedRouteConfig_settings === void 0 ? void 0 : _matchedRouteConfig_settings.polling) && 'queue' in matchedRouteConfig) {
            if (!matchedRouteConfig.queue.length) return next();
            const shallowMatchedRouteConfig = matchedRouteConfig;
            var _shallowMatchedRouteConfig___pollingIndex;
            let index = (_shallowMatchedRouteConfig___pollingIndex = shallowMatchedRouteConfig.__pollingIndex) !== null && _shallowMatchedRouteConfig___pollingIndex !== void 0 ? _shallowMatchedRouteConfig___pollingIndex : 0;
            const { time, data } = matchedRouteConfig.queue[index];
            const updateIndex = ()=>{
                if (matchedRouteConfig.queue.length - 1 === index) {
                    index = 0;
                } else {
                    index += 1;
                }
                shallowMatchedRouteConfig.__pollingIndex = index;
            };
            if (time && !shallowMatchedRouteConfig.__timeoutInProgress) {
                shallowMatchedRouteConfig.__timeoutInProgress = true;
                setTimeout(()=>{
                    shallowMatchedRouteConfig.__timeoutInProgress = false;
                    updateIndex();
                }, time);
            }
            if (!time && !shallowMatchedRouteConfig.__timeoutInProgress) {
                updateIndex();
            }
            matchedRouteConfigData = data;
        }
        if ('data' in matchedRouteConfig) {
            matchedRouteConfigData = matchedRouteConfig.data;
        }
        var _matchedRouteConfig_entities;
        const resolvedData = typeof matchedRouteConfigData === 'function' ? await matchedRouteConfigData(request, (_matchedRouteConfig_entities = matchedRouteConfig.entities) !== null && _matchedRouteConfig_entities !== void 0 ? _matchedRouteConfig_entities : {}) : matchedRouteConfigData;
        if ((_matchedRouteConfig_settings1 = matchedRouteConfig.settings) === null || _matchedRouteConfig_settings1 === void 0 ? void 0 : _matchedRouteConfig_settings1.status) {
            response.statusCode = matchedRouteConfig.settings.status;
        }
        // ✅ important:
        // set 'Cache-Control' header for explicit browsers response revalidate: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
        // this code should place before response interceptors for giving opportunity to rewrite 'Cache-Control' header
        if (matchedRequestConfig.operationType === 'query') response.set('Cache-control', 'no-cache');
        const data = await (0, _helpers.callResponseInterceptors)({
            data: resolvedData,
            request,
            response,
            interceptors: {
                routeInterceptor: (_matchedRouteConfig_interceptors1 = matchedRouteConfig.interceptors) === null || _matchedRouteConfig_interceptors1 === void 0 ? void 0 : _matchedRouteConfig_interceptors1.response,
                requestInterceptor: (_matchedRequestConfig_interceptors1 = matchedRequestConfig.interceptors) === null || _matchedRequestConfig_interceptors1 === void 0 ? void 0 : _matchedRequestConfig_interceptors1.response,
                apiInterceptor: (_graphqlConfig_interceptors = graphqlConfig.interceptors) === null || _graphqlConfig_interceptors === void 0 ? void 0 : _graphqlConfig_interceptors.response,
                serverInterceptor: serverResponseInterceptor
            }
        });
        if ((_matchedRouteConfig_settings2 = matchedRouteConfig.settings) === null || _matchedRouteConfig_settings2 === void 0 ? void 0 : _matchedRouteConfig_settings2.delay) {
            await (0, _helpers.sleep)(matchedRouteConfig.settings.delay);
        }
        return response.json(data);
    };
    router.route('/').get((0, _helpers.asyncHandler)(graphqlMiddleware));
    router.route('/').post((0, _helpers.asyncHandler)(graphqlMiddleware));
    return router;
};
