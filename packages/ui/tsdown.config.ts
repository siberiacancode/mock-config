import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: ['bin/bin.ts'],
    format: 'esm',
    outDir: 'dist/bin',
    sourcemap: false,
    target: 'node20.19'
  }
]);
