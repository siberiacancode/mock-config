"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "init", {
    enumerable: true,
    get: function() {
        return init;
    }
});
const _ansicolors = /*#__PURE__*/ _interop_require_default(require("ansi-colors"));
const _prompts = /*#__PURE__*/ _interop_require_default(require("prompts"));
const _validate = require("../src/utils/validate");
const _helpers = require("./helpers");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const init = async (argv)=>{
    try {
        const response = await (0, _prompts.default)([
            {
                name: 'withTypescript',
                type: 'toggle',
                message: 'Would you like to use TypeScript?',
                initial: true,
                active: 'Yes',
                inactive: 'No'
            },
            {
                type: 'select',
                name: 'apiType',
                message: 'Choose api type',
                initial: 0,
                choices: [
                    {
                        title: 'Rest',
                        description: 'Rest api sample',
                        value: 'rest'
                    },
                    {
                        title: 'GraphQL',
                        description: 'GraphQL api sample',
                        value: 'graphql'
                    },
                    {
                        title: 'Both',
                        description: 'Rest api and GraphQL api sample',
                        value: 'full'
                    }
                ]
            },
            {
                name: 'baseUrl',
                type: argv.baseUrl ? null : 'text',
                message: 'Base url (must start with a forward slash):',
                initial: '/',
                validate: (baseUrl)=>{
                    try {
                        _validate.baseUrlSchema.parse(baseUrl);
                        return true;
                    } catch  {
                        return 'Invalid base url value';
                    }
                }
            },
            {
                name: 'port',
                type: argv.port ? null : 'number',
                message: 'Port:',
                initial: 31299,
                validate: (port)=>{
                    try {
                        _validate.portSchema.parse(+port);
                        return true;
                    } catch  {
                        return 'Invalid port value';
                    }
                }
            },
            {
                name: 'staticPath',
                type: argv.staticPath ? null : 'text',
                message: 'Static path (must start with a forward slash):',
                initial: '/',
                validate: (staticPath)=>{
                    try {
                        _validate.staticPathSchema.parse(staticPath);
                        return true;
                    } catch  {
                        return 'Invalid static path value';
                    }
                }
            }
        ], {
            onCancel: ()=>{
                throw new Error('❌ Operation cancelled');
            }
        });
        await (0, _helpers.createTemplate)({
            ...argv,
            ...response
        });
        var _process_env_npm_config_user_agent;
        const userAgent = (_process_env_npm_config_user_agent = process.env.npm_config_user_agent) !== null && _process_env_npm_config_user_agent !== void 0 ? _process_env_npm_config_user_agent : '';
        const packageManager = /pnpm/.test(userAgent) ? 'pnpm' : /yarn/.test(userAgent) ? 'yarn' : 'npx';
        console.log('\n');
        console.log(_ansicolors.default.bold('🎉 Thanks for using mock-config-server! 🎉'));
        console.log(`start command: ${_ansicolors.default.bold(_ansicolors.default.green(`${packageManager} mcs`))}`);
    } catch (cancelled) {
        console.log(cancelled === null || cancelled === void 0 ? void 0 : cancelled.message);
        process.exit(1);
    }
};
