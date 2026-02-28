"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "urlJoin", {
    enumerable: true,
    get: function() {
        return urlJoin;
    }
});
const _os = /*#__PURE__*/ _interop_require_default(require("os"));
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
const _convertWin32PathToUnix = require("../convertWin32PathToUnix/convertWin32PathToUnix");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const urlJoin = (...paths)=>{
    const pathsToJoin = _os.default.platform() === 'win32' ? paths.map((path)=>(0, _convertWin32PathToUnix.convertWin32PathToUnix)(path)) : paths;
    return _path.default.posix.join(...pathsToJoin);
};
