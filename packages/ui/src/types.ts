import type { Arguments } from 'yargs';

export type MockServerInspectorArgv = Arguments<{
  baseUrl?: string;
  port?: number;
  config?: string;
  host?: string;
  open?: string;
}>;
