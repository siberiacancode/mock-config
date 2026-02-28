"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "cli", {
    enumerable: true,
    get: function() {
        return cli;
    }
});
const _yargs = /*#__PURE__*/ _interop_require_default(require("yargs"));
const _helpers = require("yargs/helpers");
const _build = require("./build");
const _init = require("./init");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const initOptions = {
    baseUrl: {
        alias: 'b',
        description: 'Set base url for mock server',
        type: 'string'
    },
    port: {
        alias: 'p',
        description: 'Set port for server',
        type: 'number'
    },
    staticPath: {
        alias: 's',
        description: 'Set static path for mock server',
        type: 'string'
    }
};
const cli = ()=>{
    const processArgv = (0, _helpers.hideBin)(process.argv);
    if (processArgv.includes('init')) {
        const argv = (0, _yargs.default)(processArgv).options(initOptions).parse();
        return (0, _init.init)(argv);
    }
    const argv = (0, _yargs.default)(processArgv).usage('mcs [options]').epilogue('More info: https://github.com/siberiacancode/mock-config-server#readme').options({
        ...initOptions,
        config: {
            alias: 'c',
            description: 'Set path to config file',
            type: 'string'
        },
        watch: {
            alias: 'w',
            description: 'Enables server restart after config file changes',
            type: 'boolean'
        }
    }).version().alias('version', 'v').help().alias('help', 'h').parse();
    (0, _build.build)(argv);
};
