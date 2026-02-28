"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveConfigFilePath", {
    enumerable: true,
    get: function() {
        return resolveConfigFilePath;
    }
});
const _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const resolveConfigFilePath = (cliConfigFilePath)=>{
    const appPath = process.cwd();
    if (cliConfigFilePath) return _path.default.resolve(appPath, cliConfigFilePath);
    const configFileNameRegex = /mock-server.config.(?:ts|mts|cts|js|mjs|cjs)/;
    return _fs.default.readdirSync(appPath).find((fileName)=>configFileNameRegex.test(fileName));
};
