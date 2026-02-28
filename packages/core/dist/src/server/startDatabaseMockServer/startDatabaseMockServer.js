"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "startDatabaseMockServer", {
    enumerable: true,
    get: function() {
        return startDatabaseMockServer;
    }
});
const _ansicolors = /*#__PURE__*/ _interop_require_default(require("ansi-colors"));
const _middlewares = require("../../core/middlewares");
const _constants = require("../../utils/constants");
const _createDatabaseMockServer = require("../createDatabaseMockServer/createDatabaseMockServer");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const startDatabaseMockServer = (databaseMockServerConfig)=>{
    const mockServer = (0, _createDatabaseMockServer.createDatabaseMockServer)(databaseMockServerConfig);
    var _databaseMockServerConfig_port;
    const port = (_databaseMockServerConfig_port = databaseMockServerConfig.port) !== null && _databaseMockServerConfig_port !== void 0 ? _databaseMockServerConfig_port : _constants.DEFAULT.PORT;
    const server = mockServer.listen(port, ()=>{
        console.info(_ansicolors.default.green(`🎉 Database Mock Server is running at http://localhost:${port}`));
    });
    // ✅ important: add destroy method for closing keep-alive connections after server shutdown
    return (0, _middlewares.destroyerMiddleware)(server);
};
