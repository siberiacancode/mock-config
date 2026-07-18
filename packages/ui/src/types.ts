import type { Arguments } from 'yargs';

export type MockServerInspectorArgv = Arguments<{
  port?: number;
  config?: string;
  host?: string;
  open?: boolean;
}>;
