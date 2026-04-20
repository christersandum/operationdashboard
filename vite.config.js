import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const calciteAssets = {
  src: 'node_modules/@esri/calcite-components/dist/calcite/assets',
  dest: '.',
};

// Copy @arcgis/core assets (i18n locale strings, fonts, etc.) to avoid
// falling back to the Esri CDN (js.arcgis.com) during dev and production.
const arcgisAssets = {
  src: 'node_modules/@arcgis/core/assets',
  dest: 'assets/arcgis',
};

export default defineConfig({
  base: '/operationdashboard/',
  plugins: [
    react(),
    // Copy Calcite component assets (icons + i18n strings) so they are served
    // locally instead of fetched from the Esri CDN (both dev and build).
    viteStaticCopy({ targets: [calciteAssets, arcgisAssets] }),
  ],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 5000,
  },
  optimizeDeps: {
    exclude: ['@arcgis/core', '@arcgis/map-components'],
  },
});
