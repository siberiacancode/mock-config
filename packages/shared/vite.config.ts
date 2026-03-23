import { vitest } from '@siberiacancode/vitest';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

console.log('@', path.resolve(__dirname, '.'));
export default defineConfig({
  test: {
    ...vitest,
    environment: 'node'
  }
});
