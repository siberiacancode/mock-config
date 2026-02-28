"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createRestMockServer", {
    enumerable: true,
    get: function() {
        return createRestMockServer;
    }
});
const _bodyparser = /*#__PURE__*/ _interop_require_default(require("body-parser"));
const _express = /*#__PURE__*/ _interop_require_default(require("express"));
const _database = require("../../core/database");
const _middlewares = require("../../core/middlewares");
const _rest = require("../../core/rest");
const _validate = require("../../utils/validate");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const createRestMockServer = (restMockServerConfig, server = (0, _express.default)())=>{
    var _restMockServerConfig_interceptors;
    (0, _validate.validateApiMockServerConfig)(restMockServerConfig, 'rest');
    const { cors, staticPath, configs, database, interceptors } = restMockServerConfig;
    server.use(_bodyparser.default.urlencoded({
        extended: false
    }));
    server.use(_bodyparser.default.json({
        limit: '10mb'
    }));
    server.set('json spaces', 2);
    server.use(_bodyparser.default.text());
    (0, _middlewares.contextMiddleware)(server, restMockServerConfig);
    (0, _middlewares.cookieParseMiddleware)(server);
    const serverRequestInterceptor = (_restMockServerConfig_interceptors = restMockServerConfig.interceptors) === null || _restMockServerConfig_interceptors === void 0 ? void 0 : _restMockServerConfig_interceptors.request;
    if (serverRequestInterceptor) {
        (0, _middlewares.requestInterceptorMiddleware)({
            server,
            interceptor: serverRequestInterceptor
        });
    }
    var _restMockServerConfig_baseUrl;
    const baseUrl = (_restMockServerConfig_baseUrl = restMockServerConfig.baseUrl) !== null && _restMockServerConfig_baseUrl !== void 0 ? _restMockServerConfig_baseUrl : '/';
    if (cors) {
        (0, _middlewares.corsMiddleware)(server, cors);
    } else {
        (0, _middlewares.noCorsMiddleware)(server);
    }
    if (staticPath) {
        (0, _middlewares.staticMiddleware)(server, baseUrl, staticPath);
    }
    const routerWithRestRoutes = (0, _rest.createRestRoutes)({
        router: _express.default.Router(),
        restConfig: {
            configs: configs !== null && configs !== void 0 ? configs : []
        },
        serverResponseInterceptor: interceptors === null || interceptors === void 0 ? void 0 : interceptors.response
    });
    server.use(baseUrl, routerWithRestRoutes);
    if (database) {
        const routerWithDatabaseRoutes = (0, _database.createDatabaseRoutes)(_express.default.Router(), database);
        server.use(baseUrl, routerWithDatabaseRoutes);
    }
    (0, _middlewares.errorMiddleware)(server);
    return server;
};
