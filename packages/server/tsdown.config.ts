import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    clean: true,
    entry: ['bin/bin.ts'],
    format: 'cjs',
    fixedExtension: false,
    outDir: 'dist/bin',
    sourcemap: false,
    target: 'node16'
  },
  {
    clean: true,
    entry: ['src/index.ts'],
    format: 'cjs',
    fixedExtension: false,
    outDir: 'dist',
    sourcemap: false,
    target: 'node16'
  }
]);
