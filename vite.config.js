import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  define: {
    __BUILD_VERSION__: JSON.stringify(process.env.BUILD_VERSION || 'v1.01'),
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        notFound: resolve(__dirname, '404.html'),
      },
    },
  },
});
