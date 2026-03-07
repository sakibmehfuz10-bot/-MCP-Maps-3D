import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  define: {
    'process.env': {
      API_KEY: JSON.stringify(process.env.GEMINI_API_KEY || process.env.API_KEY),
      GOOGLE_MAPS_API_KEY: JSON.stringify(process.env.GOOGLE_MAPS_API_KEY),
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './index.html',
    },
  },
});
