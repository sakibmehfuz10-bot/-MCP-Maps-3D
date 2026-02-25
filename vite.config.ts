import { defineConfig } from 'vite';

export default defineConfig({
  root: './', // Specify the project root
  build: {
    outDir: 'dist',// Output directory
    rollupOptions: {
      input: './index.html', // Ensure index.html is found correctly
    },
  },
});