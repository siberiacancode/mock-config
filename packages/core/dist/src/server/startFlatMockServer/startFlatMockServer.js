"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "startFlatMockServer", {
    enumerable: true,
    get: function() {
        return startFlatMockServer;
    }
});
const _ansicolors = /*#__PURE__*/ _interop_require_default(require("ansi-colors"));
const _middlewares = require("../../core/middlewares");
const _constants = require("../../utils/constants");
const _createFlatMockServer = require("../createFlatMockServer/createFlatMockServer");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const startFlatMockServer = (flatMockServerConfig)=>{
    const flatMockServer = (0, _createFlatMockServer.createFlatMockServer)(flatMockServerConfig);
    const [option] = flatMockServerConfig;
    const flatMockServerSettings = !('configs' in option) ? option : {};
    const { port = _constants.DEFAULT.PORT } = flatMockServerSettings;
    const server = flatMockServer.listen(port, ()=>{
        console.log(_ansicolors.default.green(`🎉 Flat Mock Server is running at http://localhost:${port}`));
    });
    // ✅ important: add destroy method for closing keep-alive connections after server shutdown
    return (0, _middlewares.destroyerMiddleware)(server);
};
