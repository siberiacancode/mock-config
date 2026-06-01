import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: ['index.ts', 'bin/bin.ts'],
    format: 'esm',
    fixedExtension: false,
    unbundle: true,
    outDir: 'dist',
    sourcemap: false,
    target: 'node20.19',
    copy: [
      { from: 'bin/templates/ts', to: 'dist/bin', flatten: false },
      { from: 'bin/templates/js', to: 'dist/bin', flatten: false }
    ]
  }
]);
