import { defineConfig } from 'vite';

export default defineConfig({
  base: '/foc-album/',
  build: {
    outDir: '../foc-album',
    emptyOutDir: true,
  },
});
