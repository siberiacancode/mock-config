import type { Buffer } from 'node:buffer';

export interface FileDescriptor {
  file: Buffer;
  path: string;
}
