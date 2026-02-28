"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createGraphQLMockServer", {
    enumerable: true,
    get: function() {
        return createGraphQLMockServer;
    }
});
const _bodyparser = /*#__PURE__*/ _interop_require_default(require("body-parser"));
const _express = /*#__PURE__*/ _interop_require_default(require("express"));
const _database = require("../../core/database");
const _graphql = require("../../core/graphql");
const _middlewares = require("../../core/middlewares");
const _validate = require("../../utils/validate");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const createGraphQLMockServer = (graphqlMockServerConfig, server = (0, _express.default)())=>{
    var _graphqlMockServerConfig_interceptors;
    (0, _validate.validateApiMockServerConfig)(graphqlMockServerConfig, 'graphql');
    const { cors, staticPath, configs, database, interceptors } = graphqlMockServerConfig;
    server.use(_bodyparser.default.urlencoded({
        extended: false
    }));
    server.use(_bodyparser.default.json({
        limit: '10mb'
    }));
    server.set('json spaces', 2);
    server.use(_bodyparser.default.text());
    (0, _middlewares.contextMiddleware)(server, graphqlMockServerConfig);
    (0, _middlewares.cookieParseMiddleware)(server);
    const serverRequestInterceptor = (_graphqlMockServerConfig_interceptors = graphqlMockServerConfig.interceptors) === null || _graphqlMockServerConfig_interceptors === void 0 ? void 0 : _graphqlMockServerConfig_interceptors.request;
    if (serverRequestInterceptor) {
        (0, _middlewares.requestInterceptorMiddleware)({
            server,
            interceptor: serverRequestInterceptor
        });
    }
    var _graphqlMockServerConfig_baseUrl;
    const baseUrl = (_graphqlMockServerConfig_baseUrl = graphqlMockServerConfig.baseUrl) !== null && _graphqlMockServerConfig_baseUrl !== void 0 ? _graphqlMockServerConfig_baseUrl : '/';
    if (cors) {
        (0, _middlewares.corsMiddleware)(server, cors);
    } else {
        (0, _middlewares.noCorsMiddleware)(server);
    }
    if (staticPath) {
        (0, _middlewares.staticMiddleware)(server, baseUrl, staticPath);
    }
    const routerWithGraphqlRoutes = (0, _graphql.createGraphQLRoutes)({
        router: _express.default.Router(),
        graphqlConfig: {
            configs: configs !== null && configs !== void 0 ? configs : []
        },
        serverResponseInterceptor: interceptors === null || interceptors === void 0 ? void 0 : interceptors.response
    });
    server.use(baseUrl, routerWithGraphqlRoutes);
    if (database) {
        const routerWithDatabaseRoutes = (0, _database.createDatabaseRoutes)(_express.default.Router(), database);
        server.use(baseUrl, routerWithDatabaseRoutes);
    }
    (0, _middlewares.errorMiddleware)(server);
    return server;
};
