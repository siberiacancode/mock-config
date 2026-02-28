"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "staticMiddleware", {
    enumerable: true,
    get: function() {
        return staticMiddleware;
    }
});
const _express = /*#__PURE__*/ _interop_require_default(require("express"));
const _constants = require("../../../utils/constants");
const _helpers = require("../../../utils/helpers");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const staticMiddleware = (server, baseUrl, staticPath)=>{
    const isStaticPathArray = Array.isArray(staticPath);
    if (isStaticPathArray) {
        staticPath.forEach((staticPath)=>{
            const isPathObject = typeof staticPath === 'object';
            if (isPathObject) {
                server.use((0, _helpers.urlJoin)(baseUrl, staticPath.prefix), _express.default.static((0, _helpers.urlJoin)(_constants.APP_PATH, staticPath.path)));
                return;
            }
            server.use(baseUrl, _express.default.static((0, _helpers.urlJoin)(_constants.APP_PATH, staticPath)));
        });
        return;
    }
    const isStaticPathObject = typeof staticPath === 'object';
    if (isStaticPathObject) {
        server.use((0, _helpers.urlJoin)(baseUrl, staticPath.prefix), _express.default.static((0, _helpers.urlJoin)(_constants.APP_PATH, staticPath.path)));
        return;
    }
    server.use(baseUrl, _express.default.static((0, _helpers.urlJoin)(_constants.APP_PATH, staticPath)));
};
