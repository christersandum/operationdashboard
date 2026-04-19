import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ArcGIS CSS — dark theme base
import '@arcgis/core/assets/esri/themes/dark/main.css';
import '@esri/calcite-components/dist/calcite/calcite.css';

// Point @arcgis/core to its local assets so locale/i18n strings are loaded
// from the local package rather than the Esri CDN (js.arcgis.com).
// Dev: assets are served directly from node_modules by Vite.
// Prod: assets are copied to assets/arcgis/ by vite-plugin-static-copy.
import esriConfig from '@arcgis/core/config';
esriConfig.assetsPath = import.meta.env.DEV
  ? `${import.meta.env.BASE_URL}node_modules/@arcgis/core/assets`
  : `${import.meta.env.BASE_URL}assets/arcgis`;

// ArcGIS map-components loader
import { defineCustomElements } from '@arcgis/map-components/dist/loader';
defineCustomElements(window);

import { defineCustomElements as defineCalciteElements } from '@esri/calcite-components/loader';
// Point Calcite to local assets served from the public folder (avoids CDN dependency)
import { setAssetPath as setCalciteAssetPath } from '@esri/calcite-components';
setCalciteAssetPath(`${window.location.origin}${import.meta.env.BASE_URL}`);
defineCalciteElements(window);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
