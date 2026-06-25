import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Pin Vitest to this package's directory. This repo's parent folder is a
// separate ("disconnected root") project that also carries a vite.config.js,
// which otherwise hijacks Vitest's root resolution and makes setupFiles
// resolve to the parent. npm always runs `test` with cwd = this package.
const projectRoot = process.cwd();

export default defineConfig({
  plugins: [react()],

  test: {
    globals: true,
    environment: 'jsdom',
    root: projectRoot,
    setupFiles: [resolve(projectRoot, 'src/test/setup.js')],
    css: false,
    // Only run this app's own tests. Ignore backend Jest suites and the
    // nested duplicate tree that the disconnected-root merge dragged in.
    include: ['src/**/*.test.{js,jsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', 'backend/**', 'test/**', 'frontend/**'],
  },

  server: {
    port: 5173,
    proxy: {
      // Local dev only — Vercel ignores this entirely
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },

  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split stable vendor chunks — browsers cache these across releases
          'vendor-react':  ['react', 'react-dom'],
          'vendor-state':  ['@reduxjs/toolkit', 'react-redux'],
          'vendor-router': ['react-router-dom'],
        },
      },
    },
  },
});
