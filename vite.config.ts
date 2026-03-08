import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  base: '/',
  publicDir: 'public',
  
  define: {
    'process.env': {
      API_KEY: JSON.stringify(process.env.GEMINI_API_KEY || process.env.API_KEY || ''),
      GOOGLE_MAPS_API_KEY: JSON.stringify(process.env.GOOGLE_MAPS_API_KEY || ''),
      GEMINI_API_KEY: JSON.stringify(process.env.GEMINI_API_KEY || ''),
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
    }
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    cors: true,
  },

  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
    cors: true,
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    rollupOptions: {
      input: './index.html',
      output: {
        entryFileNames: 'js/[name].[hash].js',
        chunkFileNames: 'js/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
      },
    },
    chunkSizeWarningLimit: 1500,
    cssCodeSplit: true,
    reportCompressedSize: false,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },

  optimizeDeps: {
    include: [
      'lit',
      '@googlemaps/js-api-loader',
      'marked',
      'highlight.js',
      'zod',
    ],
  },
});
