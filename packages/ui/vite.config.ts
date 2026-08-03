import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
import { defineConfig } from 'vite';

import pkg from './package.json' with { type: 'json' };

const INSPECTOR_PORT = pkg.config.inspectorPort;

export default defineConfig({
  root: './app',
  build: {
    outDir: '../dist/build'
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './app/src')
    }
  },
  server: {
    proxy: {
      '/api': `http://localhost:${INSPECTOR_PORT}`
    }
  }
});
