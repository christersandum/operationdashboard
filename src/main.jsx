import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ArcGIS CSS — dark theme base
import '@arcgis/core/assets/esri/themes/dark/main.css';
import '@esri/calcite-components/dist/calcite/calcite.css';

// Register OAuth 2.0 app so IdentityManager uses the OAuth redirect flow
import IdentityManager from '@arcgis/core/identity/IdentityManager';
import OAuthInfo from '@arcgis/core/identity/OAuthInfo';
import { PORTAL_URL, ARCGIS_ENABLED } from './data';

const appId = import.meta.env.VITE_ARCGIS_APP_ID;
if (ARCGIS_ENABLED && appId) {
  const oAuthInfo = new OAuthInfo({
    appId,
    portalUrl: PORTAL_URL,
    popup: false, // full-page redirect (not popup)
  });
  IdentityManager.registerOAuthInfos([oAuthInfo]);
} else if (ARCGIS_ENABLED && !appId) {
  console.warn('[main] VITE_ARCGIS_ENABLED=true but VITE_ARCGIS_APP_ID is not set — OAuth login will not work.');
}

// Do NOT force login at startup — the app loads immediately.
// Users can click "Logg inn" in the Header to authenticate.

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
