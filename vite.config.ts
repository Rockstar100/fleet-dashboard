/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` keeps asset paths relative so the static build works on any host
// (Vercel, Netlify, GitHub Pages project pages) without extra configuration.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // Recharts is the one heavy dependency (~150 kB gzipped) and lives in its own
    // chunk below. That is a deliberate trade — see README "Tradeoffs".
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Keep the charting library in its own chunk so the app shell and the
        // (rarely-changing) vendor code cache independently.
        manualChunks: {
          recharts: ['recharts'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
