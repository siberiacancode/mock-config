"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createTemplate", {
    enumerable: true,
    get: function() {
        return createTemplate;
    }
});
const _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
const _constants = require("../../src/utils/constants");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const createTemplate = (options)=>{
    const language = options.withTypescript ? 'ts' : 'js';
    const templatePath = _path.default.join(__dirname, '..', `templates/${language}/${options.apiType}`);
    _fs.default.cpSync(`${templatePath}/mock-requests`, `${_constants.APP_PATH}/mock-requests`, {
        recursive: true,
        force: true
    });
    let mockServerConfig = _fs.default.readFileSync(`${templatePath}/mock-server.config.${language}`, 'utf8');
    if (options.staticPath !== '/') {
        mockServerConfig = mockServerConfig.replace(`port: ${_constants.DEFAULT.PORT}`, `port: ${_constants.DEFAULT.PORT},\n\u0020\u0020\u0020\u0020staticPath: '${options.staticPath}'`);
    }
    mockServerConfig = mockServerConfig.replace(`port: ${_constants.DEFAULT.PORT}`, `port: ${options.port.toString()}`);
    mockServerConfig = mockServerConfig.replace("baseUrl: '/'", `baseUrl: '${options.baseUrl}'`);
    _fs.default.writeFileSync(`${_constants.APP_PATH}/mock-server.config.${language}`, mockServerConfig);
};
