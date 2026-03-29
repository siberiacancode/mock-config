import { vitest } from '@siberiacancode/vitest';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    ...vitest,
    environment: 'node'
  },
  resolve: {
    alias: {
      '@/shared': path.resolve(__dirname, '../shared'),
      '@': path.resolve(__dirname, './src')
    }
  }
});
