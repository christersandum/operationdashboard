import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ArcGIS CSS — dark theme base
import '@arcgis/core/assets/esri/themes/dark/main.css';
import '@esri/calcite-components/dist/calcite/calcite.css';

// ArcGIS API key — enables ArcGIS Online basemaps and services
import esriConfig from '@arcgis/core/config';
esriConfig.apiKey = import.meta.env.VITE_ARCGIS_API_KEY;

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
