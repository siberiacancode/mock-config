"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "startRestMockServer", {
    enumerable: true,
    get: function() {
        return startRestMockServer;
    }
});
const _ansicolors = /*#__PURE__*/ _interop_require_default(require("ansi-colors"));
const _middlewares = require("../../core/middlewares");
const _constants = require("../../utils/constants");
const _createRestMockServer = require("../createRestMockServer/createRestMockServer");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const startRestMockServer = (restMockServerConfig)=>{
    const mockServer = (0, _createRestMockServer.createRestMockServer)(restMockServerConfig);
    var _restMockServerConfig_port;
    const port = (_restMockServerConfig_port = restMockServerConfig.port) !== null && _restMockServerConfig_port !== void 0 ? _restMockServerConfig_port : _constants.DEFAULT.PORT;
    const server = mockServer.listen(port, ()=>{
        console.info(_ansicolors.default.green(`🎉 Rest Mock Server is running at http://localhost:${port}`));
    });
    // ✅ important: add destroy method for closing keep-alive connections after server shutdown
    return (0, _middlewares.destroyerMiddleware)(server);
};
