import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ArcGIS CSS — dark theme base
import '@arcgis/core/assets/esri/themes/dark/main.css';
import '@esri/calcite-components/dist/calcite/calcite.css';

// ArcGIS API key — enables basemaps (fallback for non-authenticated access)
import esriConfig from '@arcgis/core/config';
esriConfig.apiKey = import.meta.env.VITE_ARCGIS_API_KEY;

// OAuth 2.0 — redirect flow to beredskap.maps.arcgis.com
import OAuthInfo from '@arcgis/core/identity/OAuthInfo';
import IdentityManager from '@arcgis/core/identity/IdentityManager';

const oauthInfo = new OAuthInfo({
  appId: import.meta.env.VITE_ARCGIS_APP_ID,
  portalUrl: 'https://beredskap.maps.arcgis.com',
  popup: false,
});
IdentityManager.registerOAuthInfos([oauthInfo]);

// Trigger login immediately — user must be signed in before the app loads
IdentityManager.getCredential('https://beredskap.maps.arcgis.com/sharing/rest');

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
