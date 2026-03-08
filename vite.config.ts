import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  base: '/',
  publicDir: 'public',
  
  define: {
    'process.env': {
      API_KEY: JSON.stringify(process.env.GEMINI_API_KEY || process.env.API_KEY || ''),
      GOOGLE_MAPS_API_KEY: JSON.stringify(process.env.GOOGLE_MAPS_API_KEY || ''),
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
    }
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    cors: true,
    middlewareMode: false,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    }
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
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
      },
    },
    rollupOptions: {
      input: './index.html',
      external: [],
      output: {
        manualChunks: {
          vendor: ['lit', '@google/genai'],
        },
        entryFileNames: 'js/[name].[hash].js',
        chunkFileNames: 'js/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
      },
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },

  optimizeDeps: {
    include: [
      'lit',
      '@google/genai',
      '@googlemaps/js-api-loader',
      'marked',
      'highlight.js',
      'zod',
    ],
    exclude: ['@modelcontextprotocol/sdk'],
  },

  ssr: {
    noExternal: ['lit', '@google/genai'],
  },
});
