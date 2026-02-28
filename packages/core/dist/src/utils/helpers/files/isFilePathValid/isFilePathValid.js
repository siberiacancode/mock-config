"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "isFilePathValid", {
    enumerable: true,
    get: function() {
        return isFilePathValid;
    }
});
const _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const isFilePathValid = (path)=>{
    try {
        if (!_fs.default.existsSync(path)) return false;
        if (!_fs.default.statSync(path).isFile()) return false;
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};
