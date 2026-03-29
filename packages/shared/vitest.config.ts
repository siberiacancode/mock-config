import { vitest } from '@siberiacancode/vitest';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    ...vitest,
    environment: 'node'
  }
});
