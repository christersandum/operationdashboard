import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ArcGIS CSS — dark theme base
import '@arcgis/core/assets/esri/themes/dark/main.css';

// ArcGIS API key — enables ArcGIS Online basemaps and services
import esriConfig from '@arcgis/core/config';
esriConfig.apiKey = import.meta.env.VITE_ARCGIS_API_KEY;

// ArcGIS map-components loader
import { defineCustomElements } from '@arcgis/map-components/dist/loader';
defineCustomElements(window);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
