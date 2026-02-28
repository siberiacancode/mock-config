"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createDatabaseMockServer", {
    enumerable: true,
    get: function() {
        return createDatabaseMockServer;
    }
});
const _bodyparser = /*#__PURE__*/ _interop_require_default(require("body-parser"));
const _express = /*#__PURE__*/ _interop_require_default(require("express"));
const _database = require("../../core/database");
const _middlewares = require("../../core/middlewares");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const createDatabaseMockServer = (databaseMockServerConfig, server = (0, _express.default)())=>{
    var _databaseMockServerConfig_interceptors;
    const { cors, staticPath, data, routes } = databaseMockServerConfig;
    server.use(_bodyparser.default.urlencoded({
        extended: false
    }));
    server.use(_bodyparser.default.json({
        limit: '10mb'
    }));
    server.set('json spaces', 2);
    server.use(_bodyparser.default.text());
    (0, _middlewares.contextMiddleware)(server, {
        database: {
            data,
            routes
        }
    });
    (0, _middlewares.cookieParseMiddleware)(server);
    const serverRequestInterceptor = (_databaseMockServerConfig_interceptors = databaseMockServerConfig.interceptors) === null || _databaseMockServerConfig_interceptors === void 0 ? void 0 : _databaseMockServerConfig_interceptors.request;
    if (serverRequestInterceptor) {
        (0, _middlewares.requestInterceptorMiddleware)({
            server,
            interceptor: serverRequestInterceptor
        });
    }
    var _databaseMockServerConfig_baseUrl;
    const baseUrl = (_databaseMockServerConfig_baseUrl = databaseMockServerConfig.baseUrl) !== null && _databaseMockServerConfig_baseUrl !== void 0 ? _databaseMockServerConfig_baseUrl : '/';
    if (cors) {
        (0, _middlewares.corsMiddleware)(server, cors);
    } else {
        (0, _middlewares.noCorsMiddleware)(server);
    }
    if (staticPath) {
        (0, _middlewares.staticMiddleware)(server, baseUrl, staticPath);
    }
    const routerWithDatabaseRoutes = (0, _database.createDatabaseRoutes)(_express.default.Router(), {
        data,
        routes
    });
    server.use(baseUrl, routerWithDatabaseRoutes);
    (0, _middlewares.errorMiddleware)(server);
    return server;
};
