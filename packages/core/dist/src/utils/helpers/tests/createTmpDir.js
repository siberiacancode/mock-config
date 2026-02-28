"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createTmpDir", {
    enumerable: true,
    get: function() {
        return createTmpDir;
    }
});
const _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
const _os = /*#__PURE__*/ _interop_require_default(require("os"));
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const createTmpDir = ()=>_fs.default.mkdtempSync(`${_os.default.tmpdir()}${_path.default.sep}`);
