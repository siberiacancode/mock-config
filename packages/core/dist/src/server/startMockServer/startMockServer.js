"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "startMockServer", {
    enumerable: true,
    get: function() {
        return startMockServer;
    }
});
const _ansicolors = /*#__PURE__*/ _interop_require_default(require("ansi-colors"));
const _middlewares = require("../../core/middlewares");
const _constants = require("../../utils/constants");
const _createMockServer = require("../createMockServer/createMockServer");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const startMockServer = (mockServerConfig)=>{
    const mockServer = (0, _createMockServer.createMockServer)(mockServerConfig);
    var _mockServerConfig_port;
    const port = (_mockServerConfig_port = mockServerConfig.port) !== null && _mockServerConfig_port !== void 0 ? _mockServerConfig_port : _constants.DEFAULT.PORT;
    const server = mockServer.listen(port, ()=>{
        console.info(_ansicolors.default.green(`🎉 Mock Server is running at http://localhost:${port}`));
    });
    // ✅ important: add destroy method for closing keep-alive connections after server shutdown
    return (0, _middlewares.destroyerMiddleware)(server);
};
