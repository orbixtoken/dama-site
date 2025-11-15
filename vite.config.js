// site/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      // Tudo que começa com /api vai para o backend 3001 (sem CORS)
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        // mantém o prefixo /api
        rewrite: (path) => path,
      },
    },
  },
});
