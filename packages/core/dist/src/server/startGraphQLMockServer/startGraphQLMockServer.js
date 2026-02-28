"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "startGraphQLMockServer", {
    enumerable: true,
    get: function() {
        return startGraphQLMockServer;
    }
});
const _ansicolors = /*#__PURE__*/ _interop_require_default(require("ansi-colors"));
const _middlewares = require("../../core/middlewares");
const _constants = require("../../utils/constants");
const _createGraphQLMockServer = require("../createGraphQLMockServer/createGraphQLMockServer");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const startGraphQLMockServer = (graphQLMockServerConfig)=>{
    const mockServer = (0, _createGraphQLMockServer.createGraphQLMockServer)(graphQLMockServerConfig);
    var _graphQLMockServerConfig_port;
    const port = (_graphQLMockServerConfig_port = graphQLMockServerConfig.port) !== null && _graphQLMockServerConfig_port !== void 0 ? _graphQLMockServerConfig_port : _constants.DEFAULT.PORT;
    const server = mockServer.listen(port, ()=>{
        console.info(_ansicolors.default.green(`🎉 GraphQL Mock Server is running at http://localhost:${port}`));
    });
    // ✅ important: add destroy method for closing keep-alive connections after server shutdown
    return (0, _middlewares.destroyerMiddleware)(server);
};
