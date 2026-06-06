import type { BuildOptions, Plugin } from 'esbuild';

import { context, build as esBuild } from 'esbuild';

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

        build.onEnd((result) => {
          if (!result.errors.length) {
            const mockConfig = resolveConfigFile(result.outputFiles![0].text);
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

  const mockConfig = resolveConfigFile(outputFiles[0].text);
  return run(mockConfig, argv);
};
