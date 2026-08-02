import fs from 'node:fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { baseUrlSchema, portSchema, staticPathSchema } from '@/utils/validate';

import type { MockServerConfigArgv } from '../src';

import { build } from './build';
import { init } from './init';

// TODO: add link to documentation for thrown errors
const initOptions: Record<
  keyof Pick<MockServerConfigArgv, 'baseUrl' | 'port' | 'staticPath'>,
  yargs.Options
> = {
  baseUrl: {
    alias: 'b',
    description: 'Set base url for mock server',
    type: 'string',
    coerce(value: any) {
      try {
        return baseUrlSchema.parse(value);
      } catch (error: unknown) {
        throw new Error(`Invalid value for 'baseUrl': ${value}`, { cause: error });
      }
    }
  },
  port: {
    alias: 'p',
    description: 'Set port for server',
    type: 'number',
    coerce(value: any) {
      try {
        return portSchema.parse(value);
      } catch (error: unknown) {
        throw new TypeError(`Invalid value for 'port': ${value}`, { cause: error });
      }
    }
  },
  staticPath: {
    alias: 's',
    description: 'Set static path for mock server',
    type: 'string',
    coerce(value: any) {
      try {
        return staticPathSchema.parse(value);
      } catch (error: unknown) {
        throw new Error(`Invalid value for 'staticPath': ${value}`, { cause: error });
      }
    }
  }
};

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
        type: 'string',
        coerce(value: any) {
          if (!fs.existsSync(value)) {
            throw new Error(`Config file "${value}" does not exist`);
          }
          return value;
        }
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
