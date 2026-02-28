"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createMockServer", {
    enumerable: true,
    get: function() {
        return createMockServer;
    }
});
const _bodyparser = /*#__PURE__*/ _interop_require_default(require("body-parser"));
const _express = /*#__PURE__*/ _interop_require_default(require("express"));
const _database = require("../../core/database");
const _graphql = require("../../core/graphql");
const _middlewares = require("../../core/middlewares");
const _rest = require("../../core/rest");
const _helpers = require("../../utils/helpers");
const _validate = require("../../utils/validate");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const createMockServer = (mockServerConfig, server = (0, _express.default)())=>{
    var _mockServerConfig_interceptors;
    (0, _validate.validateMockServerConfig)(mockServerConfig);
    const { cors, staticPath, rest, graphql, database, interceptors } = mockServerConfig;
    server.use(_bodyparser.default.urlencoded({
        extended: false
    }));
    server.use(_bodyparser.default.json({
        limit: '10mb'
    }));
    server.set('json spaces', 2);
    server.use(_bodyparser.default.text());
    (0, _middlewares.contextMiddleware)(server, mockServerConfig);
    (0, _middlewares.cookieParseMiddleware)(server);
    const serverRequestInterceptor = (_mockServerConfig_interceptors = mockServerConfig.interceptors) === null || _mockServerConfig_interceptors === void 0 ? void 0 : _mockServerConfig_interceptors.request;
    if (serverRequestInterceptor) {
        (0, _middlewares.requestInterceptorMiddleware)({
            server,
            interceptor: serverRequestInterceptor
        });
    }
    var _mockServerConfig_baseUrl;
    const baseUrl = (_mockServerConfig_baseUrl = mockServerConfig.baseUrl) !== null && _mockServerConfig_baseUrl !== void 0 ? _mockServerConfig_baseUrl : '/';
    if (cors) {
        (0, _middlewares.corsMiddleware)(server, cors);
    } else {
        (0, _middlewares.noCorsMiddleware)(server);
    }
    if (staticPath) {
        (0, _middlewares.staticMiddleware)(server, baseUrl, staticPath);
    }
    if (rest) {
        var _rest_interceptors;
        const routerWithRestRoutes = (0, _rest.createRestRoutes)({
            router: _express.default.Router(),
            restConfig: rest,
            serverResponseInterceptor: interceptors === null || interceptors === void 0 ? void 0 : interceptors.response
        });
        var _rest_baseUrl;
        const restBaseUrl = (0, _helpers.urlJoin)(baseUrl, (_rest_baseUrl = rest.baseUrl) !== null && _rest_baseUrl !== void 0 ? _rest_baseUrl : '/');
        const apiRequestInterceptor = (_rest_interceptors = rest.interceptors) === null || _rest_interceptors === void 0 ? void 0 : _rest_interceptors.request;
        if (apiRequestInterceptor) {
            (0, _middlewares.requestInterceptorMiddleware)({
                server,
                path: restBaseUrl,
                interceptor: apiRequestInterceptor
            });
        }
        server.use(restBaseUrl, routerWithRestRoutes);
    }
    if (graphql) {
        var _graphql_interceptors;
        const routerWithGraphQLRoutes = (0, _graphql.createGraphQLRoutes)({
            router: _express.default.Router(),
            graphqlConfig: graphql,
            serverResponseInterceptor: interceptors === null || interceptors === void 0 ? void 0 : interceptors.response
        });
        var _graphql_baseUrl;
        const graphqlBaseUrl = (0, _helpers.urlJoin)(baseUrl, (_graphql_baseUrl = graphql.baseUrl) !== null && _graphql_baseUrl !== void 0 ? _graphql_baseUrl : '/');
        const apiRequestInterceptor = (_graphql_interceptors = graphql.interceptors) === null || _graphql_interceptors === void 0 ? void 0 : _graphql_interceptors.request;
        if (apiRequestInterceptor) {
            (0, _middlewares.requestInterceptorMiddleware)({
                server,
                path: graphqlBaseUrl,
                interceptor: apiRequestInterceptor
            });
        }
        server.use(graphqlBaseUrl, routerWithGraphQLRoutes);
    }
    if (database) {
        const routerWithDatabaseRoutes = (0, _database.createDatabaseRoutes)(_express.default.Router(), database);
        server.use(baseUrl, routerWithDatabaseRoutes);
    }
    (0, _middlewares.errorMiddleware)(server);
    return server;
};
