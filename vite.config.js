import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        about: resolve(import.meta.dirname, 'about.html'),
        bikePantry: resolve(import.meta.dirname, 'bike-pantry.html'),
        devx: resolve(import.meta.dirname, 'devx.html'),
        play: resolve(import.meta.dirname, 'play.html'),
        zoox: resolve(import.meta.dirname, 'zoox.html'),
        sandbox: resolve(import.meta.dirname, 'sandbox.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
