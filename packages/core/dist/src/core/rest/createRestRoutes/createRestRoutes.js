"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createRestRoutes", {
    enumerable: true,
    get: function() {
        return createRestRoutes;
    }
});
const _flat = require("flat");
const _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
const _helpers = require("../../../utils/helpers");
const _helpers1 = require("./helpers");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const createRestRoutes = ({ router, restConfig, serverResponseInterceptor })=>{
    (0, _helpers1.prepareRestRequestConfigs)(restConfig.configs).forEach((requestConfig)=>{
        router.route(requestConfig.path)[requestConfig.method]((0, _helpers.asyncHandler)(async (request, response, next)=>{
            var _requestConfig_interceptors, _matchedRouteConfig_interceptors, _matchedRouteConfig_settings, _matchedRouteConfig_settings1, _matchedRouteConfig_interceptors1, _requestConfig_interceptors1, _restConfig_interceptors, _matchedRouteConfig_settings2;
            if ((_requestConfig_interceptors = requestConfig.interceptors) === null || _requestConfig_interceptors === void 0 ? void 0 : _requestConfig_interceptors.request) {
                await (0, _helpers.callRequestInterceptor)({
                    request,
                    interceptor: requestConfig.interceptors.request
                });
            }
            const matchedRouteConfig = requestConfig.routes.find(({ entities })=>{
                if (!entities) return true;
                const entityEntries = Object.entries(entities);
                return entityEntries.every(([entityName, entityDescriptorOrValue])=>{
                    // ✅ important:
                    // check whole body as plain value strictly if descriptor used for body
                    const isEntityBodyByTopLevelDescriptor = entityName === 'body' && (0, _helpers.isEntityDescriptor)(entityDescriptorOrValue);
                    if (isEntityBodyByTopLevelDescriptor) {
                        const bodyDescriptor = entityDescriptorOrValue;
                        if (bodyDescriptor.checkMode === 'exists' || bodyDescriptor.checkMode === 'notExists') {
                            return (0, _helpers.resolveEntityValues)({
                                actualValue: request.body,
                                checkMode: bodyDescriptor.checkMode
                            });
                        }
                        var _bodyDescriptor_oneOf;
                        return (0, _helpers.resolveEntityValues)({
                            actualValue: request.body,
                            descriptorValue: bodyDescriptor.value,
                            checkMode: bodyDescriptor.checkMode,
                            oneOf: (_bodyDescriptor_oneOf = bodyDescriptor.oneOf) !== null && _bodyDescriptor_oneOf !== void 0 ? _bodyDescriptor_oneOf : false
                        });
                    }
                    const isEntityBodyByTopLevelArray = entityName === 'body' && Array.isArray(entityDescriptorOrValue);
                    if (isEntityBodyByTopLevelArray) {
                        if (!Array.isArray(request.body)) return false;
                        return (0, _helpers.resolveEntityValues)({
                            actualValue: request.body,
                            descriptorValue: entityDescriptorOrValue,
                            checkMode: 'equals'
                        });
                    }
                    const actualEntity = (0, _flat.flatten)(request[entityName]);
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
            const matchedRouteConfigDataDescriptor = {};
            if (((_matchedRouteConfig_settings = matchedRouteConfig.settings) === null || _matchedRouteConfig_settings === void 0 ? void 0 : _matchedRouteConfig_settings.polling) && 'queue' in matchedRouteConfig) {
                if (!matchedRouteConfig.queue.length) return next();
                const shallowMatchedRouteConfig = matchedRouteConfig;
                var _shallowMatchedRouteConfig___pollingIndex;
                let index = (_shallowMatchedRouteConfig___pollingIndex = shallowMatchedRouteConfig.__pollingIndex) !== null && _shallowMatchedRouteConfig___pollingIndex !== void 0 ? _shallowMatchedRouteConfig___pollingIndex : 0;
                const { time } = matchedRouteConfig.queue[index];
                const updateIndex = ()=>{
                    if (matchedRouteConfig.queue.length - 1 === index) {
                        index = 0;
                    } else {
                        index += 1;
                    }
                    shallowMatchedRouteConfig.__pollingIndex = index;
                };
                const queueItem = matchedRouteConfig.queue[index];
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
                if ('data' in queueItem) {
                    matchedRouteConfigDataDescriptor.data = queueItem.data;
                }
                if ('file' in queueItem) {
                    if (!(0, _helpers.isFilePathValid)(queueItem.file)) return next();
                    matchedRouteConfigDataDescriptor.file = queueItem.file;
                }
            }
            if ('data' in matchedRouteConfig) {
                matchedRouteConfigDataDescriptor.data = matchedRouteConfig.data;
            }
            if ('file' in matchedRouteConfig) {
                if (!(0, _helpers.isFilePathValid)(matchedRouteConfig.file)) return next();
                matchedRouteConfigDataDescriptor.file = matchedRouteConfig.file;
            }
            if ((_matchedRouteConfig_settings1 = matchedRouteConfig.settings) === null || _matchedRouteConfig_settings1 === void 0 ? void 0 : _matchedRouteConfig_settings1.status) {
                response.statusCode = matchedRouteConfig.settings.status;
            }
            // ✅ important:
            // set 'Cache-Control' header for explicit browsers response revalidate: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
            // this code should place before response interceptors for giving opportunity to rewrite 'Cache-Control' header
            if (request.method === 'GET') response.set('Cache-control', 'no-cache');
            let resolvedData = null;
            if (matchedRouteConfigDataDescriptor.data) {
                var _matchedRouteConfig_entities;
                resolvedData = typeof matchedRouteConfigDataDescriptor.data === 'function' ? await matchedRouteConfigDataDescriptor.data(request, (_matchedRouteConfig_entities = matchedRouteConfig.entities) !== null && _matchedRouteConfig_entities !== void 0 ? _matchedRouteConfig_entities : {}) : matchedRouteConfigDataDescriptor.data;
            }
            if (matchedRouteConfigDataDescriptor.file) {
                const buffer = _fs.default.readFileSync(_path.default.resolve(matchedRouteConfigDataDescriptor.file));
                resolvedData = {
                    path: matchedRouteConfigDataDescriptor.file,
                    file: buffer
                };
            }
            const data = await (0, _helpers.callResponseInterceptors)({
                data: resolvedData,
                request,
                response,
                interceptors: {
                    routeInterceptor: (_matchedRouteConfig_interceptors1 = matchedRouteConfig.interceptors) === null || _matchedRouteConfig_interceptors1 === void 0 ? void 0 : _matchedRouteConfig_interceptors1.response,
                    requestInterceptor: (_requestConfig_interceptors1 = requestConfig.interceptors) === null || _requestConfig_interceptors1 === void 0 ? void 0 : _requestConfig_interceptors1.response,
                    apiInterceptor: (_restConfig_interceptors = restConfig.interceptors) === null || _restConfig_interceptors === void 0 ? void 0 : _restConfig_interceptors.response,
                    serverInterceptor: serverResponseInterceptor
                }
            });
            if ((_matchedRouteConfig_settings2 = matchedRouteConfig.settings) === null || _matchedRouteConfig_settings2 === void 0 ? void 0 : _matchedRouteConfig_settings2.delay) {
                await (0, _helpers.sleep)(matchedRouteConfig.settings.delay);
            }
            if ((0, _helpers.isFileDescriptor)(data)) {
                const isFilePathChanged = matchedRouteConfigDataDescriptor.file !== data.path;
                if (isFilePathChanged) {
                    if (!(0, _helpers.isFilePathValid)(data.path)) return next();
                    data.file = _fs.default.readFileSync(_path.default.resolve(data.path));
                }
                // ✅ important: replace backslashes because windows can use them in file path
                const fileName = data.path.replaceAll('\\', '/').split('/').at(-1);
                const fileExtension = fileName.split('.').at(-1);
                response.type(fileExtension);
                response.set('Content-Disposition', `filename=${fileName}`);
                return response.send(data.file);
            }
            response.json(data);
        }));
    });
    return router;
};
