import { defineConfig } from 'vite';

export default defineConfig({
  // Build optimizations
  build: {
    // Output directory
    outDir: 'dist',

    // Minification
    minify: 'esbuild',

    // CSS code splitting
    cssCodeSplit: false,

    // Asset handling
    assetsInlineLimit: 4096,

    // Rollup options for chunk splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunk for any future npm dependencies
          // vendor: [],
        },
        // Asset file naming
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name.split('.').pop();
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/css/i.test(extType)) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },

    // Source maps for production debugging
    sourcemap: false,
  },

  // Development server
  server: {
    port: 3000,
    open: true,
    // Hot module replacement
    hmr: true,
  },

  // Preview server (for testing production builds)
  preview: {
    port: 4173,
    open: true,
  },

  // CSS processing
  css: {
    devSourcemap: true,
  },

  // Resolve aliases (optional, for cleaner imports)
  resolve: {
    alias: {
      '@': '/src',
      '@styles': '/src/style',
      '@js': '/src/js',
    },
  },
});
