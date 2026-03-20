import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/operationdashboard/',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 5000,
  },
  optimizeDeps: {
    exclude: ['@arcgis/core', '@arcgis/map-components'],
  },
});
