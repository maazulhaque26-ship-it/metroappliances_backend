import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
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
