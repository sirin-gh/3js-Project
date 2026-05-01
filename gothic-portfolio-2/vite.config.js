import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: true,   // exposes on local network → needed for AR mobile testing
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
});
