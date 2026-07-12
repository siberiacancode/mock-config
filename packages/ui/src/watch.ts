import type { BuildOptions, Plugin } from 'esbuild';

import { context, build as esBuild } from 'esbuild';
import fs from 'node:fs';
import { Module } from 'node:module';
import path from 'node:path';

import type { MockServerInspectorArgv } from './types';

const resolveExportsFromSourceCode = (sourceCode: string) => {
  const moduleInstance = new Module('mock-server.config');

  // @ts-expect-error _compile is a private nodejs module api
  moduleInstance._compile(sourceCode, 'mock-server.config.cjs');
  return moduleInstance.exports;
};

const resolveConfigFile = (configSourceCode: string) => {
  if (!configSourceCode) {
    throw new Error('Cannot handle source code of mock-server.config.(ts|js)');
  }

  const mockServerConfigExports = resolveExportsFromSourceCode(configSourceCode);

  const mockServerConfig: any = mockServerConfigExports.default;

  if (!mockServerConfig) {
    throw new Error('Cannot handle exports of mock-server.config.(ts|js)');
  }

  if (!Array.isArray(mockServerConfig)) {
    throw new TypeError(
      'configuration should be array; see our doc (https://www.npmjs.com/package/mock-config-server) for more information'
    );
  }
  return mockServerConfig;
};

const resolveConfigFilePath = (cliConfigFilePath?: string) => {
  const appPath = process.cwd();

  if (cliConfigFilePath) return path.resolve(appPath, cliConfigFilePath);

  const configFileNameRegex = /mock-server.config.(?:ts|mts|cts|js|mjs|cjs)/;

  return fs.readdirSync(appPath).find((fileName) => configFileNameRegex.test(fileName));
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

  const watchPlugin: Plugin = {
    name: 'watch',
    setup: (build) => {
      build.onEnd((result) => {
        if (result.errors.length) return;
        mockConfig = resolveConfigFile(result.outputFiles![0].text);
        onUpdate(mockConfig);
      });
    }
  };

  buildOptions.plugins.push(watchPlugin);
  const ctx = await context(buildOptions);
  ctx.watch();

  const { outputFiles } = await esBuild(buildOptions);
  mockConfig = resolveConfigFile(outputFiles[0].text);

  const getConfig = () => mockConfig;

  return { getConfig };
};
