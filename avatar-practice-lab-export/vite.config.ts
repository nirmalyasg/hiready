import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  appType: 'spa',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './ui'),
      '@/components': path.resolve(__dirname, './ui/components'),
      '@/pages': path.resolve(__dirname, './ui/pages'),
      '@/hooks': path.resolve(__dirname, './ui/hooks'),
      '@/lib': path.resolve(__dirname, './ui/lib'),
      '@/contexts': path.resolve(__dirname, './ui/contexts'),
      '@/types': path.resolve(__dirname, './ui/types'),
      '@assets': path.resolve(__dirname, './attached_assets'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
  },
  build: {
    outDir: 'dist/client',
  },
});
