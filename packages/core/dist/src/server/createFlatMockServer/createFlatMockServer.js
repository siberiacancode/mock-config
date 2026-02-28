"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createFlatMockServer", {
    enumerable: true,
    get: function() {
        return createFlatMockServer;
    }
});
const _bodyparser = /*#__PURE__*/ _interop_require_default(require("body-parser"));
const _express = /*#__PURE__*/ _interop_require_default(require("express"));
const _database = require("../../core/database");
const _graphql = require("../../core/graphql");
const _middlewares = require("../../core/middlewares");
const _rest = require("../../core/rest");
const _validate = require("../../utils/validate");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const createFlatMockServer = (flatMockServerConfig, server = (0, _express.default)())=>{
    (0, _validate.validateFlatMockServerConfig)(flatMockServerConfig);
    const [option, ...flatMockServerComponents] = flatMockServerConfig;
    const flatMockServerSettings = !('configs' in option) ? option : undefined;
    const { cors, staticPath, interceptors, baseUrl: serverBaseUrl = '/', database } = flatMockServerSettings !== null && flatMockServerSettings !== void 0 ? flatMockServerSettings : {};
    server.use(_bodyparser.default.urlencoded({
        extended: false
    }));
    server.use(_bodyparser.default.json({
        limit: '10mb'
    }));
    server.set('json spaces', 2);
    server.use(_bodyparser.default.text());
    (0, _middlewares.contextMiddleware)(server, {
        database
    });
    (0, _middlewares.cookieParseMiddleware)(server);
    const serverRequestInterceptor = interceptors === null || interceptors === void 0 ? void 0 : interceptors.request;
    if (serverRequestInterceptor) {
        (0, _middlewares.requestInterceptorMiddleware)({
            server,
            interceptor: serverRequestInterceptor
        });
    }
    if (cors) {
        (0, _middlewares.corsMiddleware)(server, cors);
    } else {
        (0, _middlewares.noCorsMiddleware)(server);
    }
    if (staticPath) {
        (0, _middlewares.staticMiddleware)(server, serverBaseUrl, staticPath);
    }
    if (database) {
        const routerWithDatabaseRoutes = (0, _database.createDatabaseRoutes)(_express.default.Router(), database);
        server.use(serverBaseUrl, routerWithDatabaseRoutes);
    }
    const components = flatMockServerSettings ? flatMockServerComponents : flatMockServerConfig;
    const { restRequestConfigs, graphQLRequestConfigs } = components.reduce((acc, component)=>{
        const { baseUrl = '' } = component;
        component.configs.forEach((config)=>{
            var _component_interceptors, _config_interceptors, _component_interceptors1, _config_interceptors1;
            const interceptors = {
                ...(((_component_interceptors = component.interceptors) === null || _component_interceptors === void 0 ? void 0 : _component_interceptors.request) || ((_config_interceptors = config.interceptors) === null || _config_interceptors === void 0 ? void 0 : _config_interceptors.request)) && {
                    request: (params)=>{
                        var _component_interceptors, _config_interceptors;
                        if ((_component_interceptors = component.interceptors) === null || _component_interceptors === void 0 ? void 0 : _component_interceptors.request) {
                            component.interceptors.request(params);
                        }
                        if ((_config_interceptors = config.interceptors) === null || _config_interceptors === void 0 ? void 0 : _config_interceptors.request) {
                            config.interceptors.request(params);
                        }
                    }
                },
                ...(((_component_interceptors1 = component.interceptors) === null || _component_interceptors1 === void 0 ? void 0 : _component_interceptors1.response) || ((_config_interceptors1 = config.interceptors) === null || _config_interceptors1 === void 0 ? void 0 : _config_interceptors1.response)) && {
                    response: (data, params)=>{
                        var _config_interceptors, _component_interceptors;
                        if ((_config_interceptors = config.interceptors) === null || _config_interceptors === void 0 ? void 0 : _config_interceptors.response) {
                            data = config.interceptors.response(data, params);
                        }
                        if ((_component_interceptors = component.interceptors) === null || _component_interceptors === void 0 ? void 0 : _component_interceptors.response) {
                            data = component.interceptors.response(data, params);
                        }
                        return data;
                    }
                }
            };
            const isRest = 'method' in config;
            if (isRest) acc.restRequestConfigs.push({
                ...config,
                interceptors,
                path: config.path instanceof RegExp ? new RegExp(`${baseUrl}${config.path.source}`, config.path.flags) : `${baseUrl}${config.path}`
            });
            const isGraphql = 'operationType' in config;
            if (isGraphql) acc.graphQLRequestConfigs.push({
                ...config,
                interceptors
            });
        });
        return acc;
    }, {
        restRequestConfigs: [],
        graphQLRequestConfigs: []
    });
    if (restRequestConfigs.length) {
        const routerWithRestRoutes = (0, _rest.createRestRoutes)({
            router: _express.default.Router(),
            restConfig: {
                configs: restRequestConfigs
            },
            serverResponseInterceptor: interceptors === null || interceptors === void 0 ? void 0 : interceptors.response
        });
        server.use(serverBaseUrl, routerWithRestRoutes);
    }
    if (graphQLRequestConfigs.length) {
        const routerWithGraphQLRoutes = (0, _graphql.createGraphQLRoutes)({
            router: _express.default.Router(),
            graphqlConfig: {
                configs: graphQLRequestConfigs
            },
            serverResponseInterceptor: interceptors === null || interceptors === void 0 ? void 0 : interceptors.response
        });
        server.use(serverBaseUrl, routerWithGraphQLRoutes);
    }
    (0, _middlewares.errorMiddleware)(server);
    return server;
};
