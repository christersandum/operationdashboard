import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const calciteAssets = {
  src: 'node_modules/@esri/calcite-components/dist/calcite/assets',
  dest: '.',
};

export default defineConfig({
  base: '/operationdashboard/',
  plugins: [
    react(),
    // Copy Calcite component assets (icons + i18n strings) so they are served
    // locally instead of fetched from the Esri CDN (both dev and build).
    viteStaticCopy({ targets: [calciteAssets] }),
  ],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 5000,
  },
  optimizeDeps: {
    exclude: ['@arcgis/core', '@arcgis/map-components'],
  },
});
