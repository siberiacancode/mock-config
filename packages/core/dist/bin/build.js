"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "build", {
    enumerable: true,
    get: function() {
        return build;
    }
});
const _esbuild = require("esbuild");
const _helpers = require("./helpers");
const _run = require("./run");
const _runFlatConfig = require("./runFlatConfig");
const build = async (argv)=>{
    const configFilePath = (0, _helpers.resolveConfigFilePath)(argv.config);
    if (!configFilePath) {
        throw new Error('Cannot find config file mock-server.config.(ts|mts|cts|js|mjs|cjs)');
    }
    const buildOptions = {
        entryPoints: [
            configFilePath
        ],
        bundle: true,
        platform: 'node',
        target: 'esnext',
        minifySyntax: true,
        minify: true,
        write: false,
        metafile: false,
        logLevel: 'info',
        plugins: []
    };
    if (argv.watch) {
        const watchPlugin = {
            name: 'watch',
            setup: (build)=>{
                let instance;
                build.onStart(()=>{
                    instance === null || instance === void 0 ? void 0 : instance.destroy();
                });
                build.onEnd((result)=>{
                    if (!result.errors.length) {
                        const mockConfig = (0, _helpers.resolveConfigFile)(result.outputFiles[0].text);
                        const isFlatConfig = Array.isArray(mockConfig);
                        if (isFlatConfig) {
                            instance = (0, _runFlatConfig.runFlatConfig)(mockConfig, argv);
                            return;
                        }
                        instance = (0, _run.run)(mockConfig, argv);
                    }
                });
            }
        };
        buildOptions.plugins.push(watchPlugin);
        const ctx = await (0, _esbuild.context)(buildOptions);
        ctx.watch();
        return;
    }
    const { outputFiles } = await (0, _esbuild.build)(buildOptions);
    const mockConfig = (0, _helpers.resolveConfigFile)(outputFiles[0].text);
    const isFlatConfig = Array.isArray(mockConfig);
    if (isFlatConfig) {
        return (0, _runFlatConfig.runFlatConfig)(mockConfig, argv);
    }
    (0, _run.run)(mockConfig, argv);
};
