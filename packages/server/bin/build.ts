import type { BuildOptions, Plugin } from 'esbuild';

import { context, build as esBuild } from 'esbuild';
import path from 'node:path';

import type { MockServerCliArgv } from '@/utils/types';

import { resolveConfigFile, resolveConfigFilePath } from './helpers';
import { run } from './run';

export const build = async (argv: MockServerCliArgv) => {
  const configFilePath = resolveConfigFilePath(argv.config);
  if (!configFilePath) {
    throw new Error('Cannot find config file mock-server.config.(ts|mts|cts|js|mjs|cjs)');
  }

  const buildOptions = {
    entryPoints: [configFilePath],
    bundle: true,
    platform: 'node',
    target: 'esnext',
    minifySyntax: true,
    minify: true,
    write: false,
    metafile: false,
    logLevel: 'info',
    format: 'esm',
    banner: {
      js: 'import { createRequire as __mcsCreateRequire } from "node:module"; const require = __mcsCreateRequire(import.meta.url);'
    },
    plugins: [] as Plugin[]
  } satisfies BuildOptions;

  if (argv.watch) {
    const watchPlugin: Plugin = {
      name: 'watch',
      setup: (build) => {
        let instance: Awaited<ReturnType<typeof run>>;

        build.onStart(() => {
          instance?.destroy();
        });

        build.onEnd(async (result) => {
          if (!result.errors.length) {
            const mockConfig = await resolveConfigFile(
              result.outputFiles![0].text,
              path.dirname(configFilePath)
            );
            instance = run(mockConfig, argv);
          }
        });
      }
    };

    buildOptions.plugins.push(watchPlugin);

    const ctx = await context(buildOptions);

    ctx.watch();
    return;
  }

  const { outputFiles } = await esBuild(buildOptions);

  const mockConfig = await resolveConfigFile(outputFiles[0].text, path.dirname(configFilePath));
  return run(mockConfig, argv);
};
