import color from 'ansi-colors';
import fs from 'node:fs';
import process from 'node:process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import type { PlaygroundServerConfig } from '@/utils/types';

import { playgroundDataSchema } from '@/utils/validate';

import { playground } from './playground';

export const cli = () => {
  const processArgv = hideBin(process.argv);

  const argv = yargs(processArgv)
    .command('$0 <data>', 'Run playground server', (yargs) =>
      yargs.positional('data', {
        describe: 'Path to json file',
        type: 'string',
        demandOption: true
      })
    )
    .epilogue('More info: https://github.com/siberiacancode/mock-config/packages/playground#readme')
    .options({
      baseUrl: {
        alias: 'b',
        description: 'Set base url for playground server',
        type: 'string' as const
      },
      port: {
        alias: 'p',
        description: 'Set port for server',
        type: 'number' as const
      },
      staticPath: {
        alias: 's',
        description: 'Set static path for server',
        type: 'string' as const
      }
    })
    .version()
    .alias('version', 'v')
    .help()
    .alias('help', 'h')
    .parse() as unknown as PlaygroundServerConfig;

  if (!fs.existsSync(argv.data as string)) {
    console.error(`${color.red('Error')}: File ${argv.data} does not exist`);
    process.exit(1);
  }

  const dataContent = fs.readFileSync(argv.data as string, 'utf-8');
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
};
