/* ============================================================
   dataProvider.js — DataProvider factory
   Exports factory functions for local (offline) and ArcGIS
   Online data backends, both implementing the same interface:

     load(operationId)  → { units, incidents, missions, ao, chat, meta }
     save(opData, overwrite?)  → Promise
     autoSave(operationId, data)
     addUnit(unit, operationId)
     addIncident(inc, operationId)
     addMission(mission, incidents, operationId)

   Wire-up in App.jsx:
     const provider = ARCGIS_ENABLED && isSignedIn
       ? createArcGISProvider(serviceUrls, currentOpName)
       : createLocalProvider();
   ============================================================ */

export { createLocalProvider, listLocalOperations } from './localProvider';
export { createArcGISProvider }                     from './arcgisProvider';
