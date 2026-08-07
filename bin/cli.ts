import color from 'ansi-colors';
import fs from 'node:fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { playgroundDataSchema } from '@/utils/validate';

import type {
  MockServerConfigArgv,
  MockServerConfigInitArgv,
  MockServerConfigPlaygroundArgv
} from '../src';

import { build } from './build';
import { init } from './init';
import { playground } from './playground';

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

  if (processArgv.includes('playground')) {
    const argv = yargs(processArgv)
      .command('playground <data>', 'Run playground server', (yargs) =>
        yargs.positional('data', {
          describe: 'Path to json file',
          type: 'string',
          required: true
        })
      )
      .strict()
      .parse() as MockServerConfigPlaygroundArgv;

    if (!fs.existsSync(argv.data)) {
      console.error(`${color.red('Error')}: File ${argv.data} does not exist`);
      process.exit(1);
    }

    const dataContent = fs.readFileSync(argv.data, 'utf-8');
    try {
      const { error } = playgroundDataSchema.safeParse(JSON.parse(dataContent));

      if (error) throw new Error(`Data file should be a valid object`);
    } catch (error) {
      console.error(
        `${color.red('Error')}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      process.exit(1);
    }

    return playground(argv);
  }

  if (processArgv.includes('init')) {
    const argv = yargs(processArgv).options(initOptions).parse() as MockServerConfigInitArgv;

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
