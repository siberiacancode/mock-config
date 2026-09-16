import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import type { MockServerInspectorArgv } from './types';

import { start } from './start';

export const cli = () => {
  const processArgv = hideBin(process.argv);

  const argv = yargs(processArgv)
    .usage('mci [options]')
    .usage('mock-config-inspector [options]')
    .epilogue('More info: https://github.com/siberiacancode/mock-config#readme')
    .options({
      port: {
        alias: 'p',
        description: 'Set port for server',
        type: 'number'
      },
      config: {
        alias: 'c',
        description: 'Set path to config file',
        type: 'string'
      },
      host: {
        alias: 'h',
        description: 'Set host for server',
        type: 'string'
      },
      open: {
        alias: 'o',
        description: 'Open browser',
        type: 'boolean'
      }
    })
    .version()
    .alias('version', 'v')
    .help()
    .alias('help', 'h')
    .parse() as MockServerInspectorArgv;

  start(argv);
};
