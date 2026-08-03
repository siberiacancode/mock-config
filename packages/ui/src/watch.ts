import type { BuildOptions, BuildResult, Plugin } from 'esbuild';

import { context } from 'esbuild';
import fs from 'node:fs';
import { Module } from 'node:module';
import path from 'node:path';

import type { MockServerInspectorArgv } from './types';

const resolveExportsFromSourceCode = (sourceCode: string, configFilePath: string) => {
  const moduleInstance = new Module(configFilePath);

  moduleInstance.filename = configFilePath;
  // @ts-expect-error _nodeModulePaths is a private nodejs module api
  moduleInstance.paths = Module._nodeModulePaths(path.dirname(configFilePath));
  // @ts-expect-error _compile is a private nodejs module api
  moduleInstance._compile(sourceCode, configFilePath);
  return moduleInstance.exports;
};

const resolveConfigFile = (configSourceCode: string, configFilePath: string) => {
  if (!configSourceCode) {
    throw new Error('Cannot handle source code of mock-server.config.(ts|js)');
  }

  const mockServerConfigExports = resolveExportsFromSourceCode(configSourceCode, configFilePath);

  const mockServerConfig: any = mockServerConfigExports.default;

  if (!mockServerConfig) {
    throw new Error('Cannot handle exports of mock-server.config.(ts|js)');
  }

  if (!Array.isArray(mockServerConfig)) {
    throw new TypeError(
      'configuration should be array; see our doc (https://npmx.dev/package/mock-config-server) for more information'
    );
  }
  return mockServerConfig;
};

const resolveConfigFilePath = (cliConfigFilePath?: string) => {
  const appPath = process.cwd();

  if (cliConfigFilePath) return path.resolve(appPath, cliConfigFilePath);

  const configFileNameRegex = /mock-server.config.(?:ts|mts|cts|js|mjs|cjs)/;

  const configFileName = fs
    .readdirSync(appPath)
    .find((fileName) => configFileNameRegex.test(fileName));
  return configFileName && path.resolve(appPath, configFileName);
};

export const createConfigWatcher = async (
  argv: MockServerInspectorArgv,
  onUpdate: (mockConfig: any) => void
) => {
  const configFilePath = resolveConfigFilePath(argv.config);
  if (!configFilePath) {
    throw new Error('Cannot find config file mock-server.config.(ts|mts|cts|js|mjs|cjs)');
  }

  let mockConfig: any;

  const buildOptions = {
    entryPoints: [configFilePath],
    bundle: true,
    platform: 'node',
    target: 'esnext',
    write: false,
    metafile: false,
    logLevel: 'info',
    plugins: [] as Plugin[]
  } satisfies BuildOptions;

  let resolveFirstBuild!: (result: BuildResult) => void;
  const firstBuild = new Promise<BuildResult>((resolve) => {
    resolveFirstBuild = resolve;
  });

  const watchPlugin: Plugin = {
    name: 'watch',
    setup: (build) => {
      build.onEnd((result) => {
        if (!result.errors.length) {
          mockConfig = resolveConfigFile(result.outputFiles![0].text, configFilePath);
          onUpdate(mockConfig);
        }
        resolveFirstBuild(result);
      });
    }
  };

  buildOptions.plugins.push(watchPlugin);
  const ctx = await context(buildOptions);
  await ctx.watch();

  const firstBuildResult = await firstBuild;
  if (firstBuildResult.errors.length) {
    throw new Error('Cannot build config file mock-server.config.(ts|mts|cts|js|mjs|cjs)');
  }

  const getConfig = () => mockConfig;

  return { getConfig };
};
