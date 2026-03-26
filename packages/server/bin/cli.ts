import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import type { MockServerConfigArgv } from '../src';

import { build } from './build';
import { init } from './init';

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
} as const;

export const cli = () => {
  const processArgv = hideBin(process.argv);

  if (processArgv.includes('init')) {
    const argv = yargs(processArgv).options(initOptions).parse() as MockServerConfigArgv;

    return init(argv);
  }

  const argv = yargs(processArgv)
    .usage('mcs [options]')
    .epilogue('More info: https://github.com/siberiacancode/mock-config-server#readme')
    .options({
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
    })
    .version()
    .alias('version', 'v')
    .help()
    .alias('help', 'h')
    .parse() as MockServerConfigArgv;

  build(argv);
};
