import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: ['bin/cli.ts'],
    format: 'esm',
    fixedExtension: false,
    outDir: 'dist',
    sourcemap: false,
    shims: true,
    target: 'node20.19',
    copy: [
      { from: 'bin/templates/ts', to: 'dist/templates' },
      { from: 'bin/templates/js', to: 'dist/templates' },
      { from: 'bin/bin.cjs', to: 'dist' }
    ]
  }
]);
