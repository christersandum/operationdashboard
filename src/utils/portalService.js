/* ============================================================
   portalService.js — ArcGIS Online portal management
   Handles folder/Feature Service creation and lookup in the
   "OPS" folder of the authenticated user's ArcGIS Online content.
   ============================================================ */

import Portal from '@arcgis/core/portal/Portal';
import IdentityManager from '@arcgis/core/identity/IdentityManager';
import { PORTAL_URL, OPS_FOLDER_NAME, WEBMAP_ITEM_TITLE } from '../data';

const SR_25833 = { wkid: 25833 };

// ── Common fields shared by all Feature Layers and the Table ─
const COMMON_FIELDS = [
  { name: 'Operation_id',   type: 'esriFieldTypeString', alias: 'Operation ID',   length: 100, nullable: false },
  { name: 'Operation_name', type: 'esriFieldTypeString', alias: 'Operation Name', length: 255, nullable: true  },
];

// ── Feature Service definitions ──────────────────────────────
const SERVICE_DEFINITIONS = {
  units: {
    name: 'OPS_Units',
    geometryType: 'esriGeometryPoint',
    fields: [
      ...COMMON_FIELDS,
      { name: 'unit_id',              type: 'esriFieldTypeString',  alias: 'Unit ID',              length: 50  },
      { name: 'name',                 type: 'esriFieldTypeString',  alias: 'Name',                 length: 255 },
      { name: 'role',                 type: 'esriFieldTypeString',  alias: 'Role',                 length: 100 },
      { name: 'status',               type: 'esriFieldTypeString',  alias: 'Status',               length: 50  },
      { name: 'moving',               type: 'esriFieldTypeInteger', alias: 'Moving'                             },
      { name: 'assigned_incident',    type: 'esriFieldTypeString',  alias: 'Assigned Incident',    length: 100 },
      { name: 'incident_color_index', type: 'esriFieldTypeInteger', alias: 'Incident Color Index'              },
      { name: 'x_coord',              type: 'esriFieldTypeDouble',  alias: 'Easting UTM33'                      },
      { name: 'y_coord',              type: 'esriFieldTypeDouble',  alias: 'Northing UTM33'                     },
    ],
  },
  incidents: {
    name: 'OPS_Incidents',
    geometryType: 'esriGeometryPoint',
    fields: [
      ...COMMON_FIELDS,
      { name: 'incident_id',  type: 'esriFieldTypeString',  alias: 'Incident ID', length: 50  },
      { name: 'title',        type: 'esriFieldTypeString',  alias: 'Title',       length: 255 },
      { name: 'description',  type: 'esriFieldTypeString',  alias: 'Description', length: 2000 },
      { name: 'priority',     type: 'esriFieldTypeString',  alias: 'Priority',    length: 50  },
      { name: 'icon',         type: 'esriFieldTypeString',  alias: 'Icon',        length: 20  },
      { name: 'time',         type: 'esriFieldTypeString',  alias: 'Time',        length: 20  },
      { name: 'color_index',  type: 'esriFieldTypeInteger', alias: 'Color Index'              },
      { name: 'x_coord',      type: 'esriFieldTypeDouble',  alias: 'Easting UTM33'            },
      { name: 'y_coord',      type: 'esriFieldTypeDouble',  alias: 'Northing UTM33'           },
    ],
  },
  missions: {
    name: 'OPS_Missions',
    geometryType: 'esriGeometryPoint',
    fields: [
      ...COMMON_FIELDS,
      { name: 'mission_id',         type: 'esriFieldTypeString',  alias: 'Mission ID',          length: 50   },
      { name: 'incident_id',        type: 'esriFieldTypeString',  alias: 'Incident ID',         length: 50   },
      { name: 'title',              type: 'esriFieldTypeString',  alias: 'Title',               length: 255  },
      { name: 'description',        type: 'esriFieldTypeString',  alias: 'Description',         length: 2000 },
      { name: 'status',             type: 'esriFieldTypeString',  alias: 'Status',              length: 50   },
      { name: 'assigned_unit_ids',  type: 'esriFieldTypeString',  alias: 'Assigned Unit IDs',   length: 500  },
      { name: 'x_coord',            type: 'esriFieldTypeDouble',  alias: 'Easting UTM33'                     },
      { name: 'y_coord',            type: 'esriFieldTypeDouble',  alias: 'Northing UTM33'                    },
    ],
  },
  ao: {
    name: 'OPS_AO',
    geometryType: 'esriGeometryPolygon',
    fields: [
      ...COMMON_FIELDS,
      { name: 'ao_label', type: 'esriFieldTypeString', alias: 'AO Label', length: 255 },
    ],
  },
  operations: {
    name: 'OPS_Operations',
    geometryType: null, // table, no geometry
    fields: [
      ...COMMON_FIELDS,
      { name: 'center_lng',   type: 'esriFieldTypeDouble',  alias: 'Center Longitude'            },
      { name: 'center_lat',   type: 'esriFieldTypeDouble',  alias: 'Center Latitude'             },
      { name: 'zoom',         type: 'esriFieldTypeInteger', alias: 'Zoom Level'                  },
      { name: 'commander',    type: 'esriFieldTypeString',  alias: 'Commander',     length: 255  },
      { name: 'ao_center',    type: 'esriFieldTypeString',  alias: 'AO Center',     length: 100  },
      { name: 'progress',     type: 'esriFieldTypeInteger', alias: 'Progress (%)'                },
      { name: 'elapsed',      type: 'esriFieldTypeDouble',  alias: 'Elapsed (ms)'                },
      { name: 'staged',       type: 'esriFieldTypeInteger', alias: 'Staged (0/1)'                },
      { name: 'stats_json',   type: 'esriFieldTypeString',  alias: 'Stats JSON',    length: 1000 },
      { name: 'alerts_json',  type: 'esriFieldTypeString',  alias: 'Alerts JSON',   length: 4000 },
      { name: 'chat_json',    type: 'esriFieldTypeString',  alias: 'Chat JSON',     length: 32000 },
      { name: 'created_at',   type: 'esriFieldTypeDate',    alias: 'Created At'                  },
      { name: 'updated_at',   type: 'esriFieldTypeDate',    alias: 'Updated At'                  },
    ],
  },
};

// ── Get portal token for fetch requests ──────────────────────
async function getToken() {
  const cred = await IdentityManager.getCredential(`${PORTAL_URL}/sharing/rest`);
  return cred.token;
}

// ── Get portal user info ──────────────────────────────────────
export async function getPortalUser() {
  const portal = new Portal({ url: PORTAL_URL });
  await portal.load();
  return portal.user;
}

// ── Ensure "OPS" folder exists; return folder ID ─────────────
async function ensureOpsFolder(token) {
  const username = (await getPortalUser()).username;
  const url = `${PORTAL_URL}/sharing/rest/content/users/${username}?f=json&token=${token}`;
  const resp = await fetch(url);
  const data = await resp.json();
  const existing = (data.folders || []).find(f => f.title === OPS_FOLDER_NAME);
  if (existing) return existing.id;

  // Create folder
  const createUrl = `${PORTAL_URL}/sharing/rest/content/users/${username}/createFolder`;
  const body = new URLSearchParams({ title: OPS_FOLDER_NAME, f: 'json', token });
  const createResp = await fetch(createUrl, { method: 'POST', body });
  const createData = await createResp.json();
  if (createData.folder) return createData.folder.id;
  throw new Error(`Failed to create folder "${OPS_FOLDER_NAME}": ${JSON.stringify(createData)}`);
}

// ── Find existing Feature Service item in the OPS folder ─────
async function findServiceInFolder(token, serviceName) {
  const username = (await getPortalUser()).username;
  const q = encodeURIComponent(`title:"${serviceName}" owner:${username} type:"Feature Service"`);
  const url = `${PORTAL_URL}/sharing/rest/search?q=${q}&f=json&token=${encodeURIComponent(token)}&num=10`;
  const resp = await fetch(url);
  const data = await resp.json();
  const item = (data.results || []).find(r => r.title === serviceName);
  return item || null;
}

// ── Create a hosted Feature Service ──────────────────────────
async function createFeatureService(token, folderId, def) {
  const username = (await getPortalUser()).username;

  // 1. Create empty hosted Feature Service
  const createServiceUrl = `${PORTAL_URL}/sharing/rest/content/users/${username}/${folderId}/createService`;
  const serviceParams = {
    f: 'json',
    token,
    outputType: 'featureService',
    createParameters: JSON.stringify({
      name: def.name,
      serviceDescription: `OPS Feature Service: ${def.name}`,
      hasStaticData: false,
      maxRecordCount: 10000,
      supportedQueryFormats: 'JSON',
      capabilities: 'Create,Delete,Query,Update,Editing',
      spatialReference: SR_25833,
      initialExtent: {
        xmin: 200000, ymin: 6400000, xmax: 1100000, ymax: 7900000,
        spatialReference: SR_25833,
      },
    }),
  };
  const csResp = await fetch(createServiceUrl, {
    method: 'POST',
    body: new URLSearchParams(serviceParams),
  });
  const csData = await csResp.json();
  if (!csData.serviceurl && !csData.encodedServiceURL) {
    throw new Error(`createService failed for ${def.name}: ${JSON.stringify(csData)}`);
  }
  const serviceUrl = csData.serviceurl || csData.encodedServiceURL;

  // 2. Add layer (or table) to the Feature Service
  const addLayerUrl = `${serviceUrl}/addToDefinition`;
  const layerDef = def.geometryType
    ? {
        layers: [{
          name: def.name,
          type: 'Feature Layer',
          geometryType: def.geometryType,
          spatialReference: SR_25833,
          fields: def.fields,
          objectIdField: 'OBJECTID',
          globalIdField: '',
          capabilities: 'Create,Delete,Query,Update,Editing',
        }],
      }
    : {
        tables: [{
          name: def.name,
          type: 'Table',
          fields: def.fields,
          objectIdField: 'OBJECTID',
          globalIdField: '',
          capabilities: 'Create,Delete,Query,Update,Editing',
        }],
      };

  const alResp = await fetch(addLayerUrl, {
    method: 'POST',
    body: new URLSearchParams({ f: 'json', token, addToDefinition: JSON.stringify(layerDef) }),
  });
  const alData = await alResp.json();
  if (!alData.success) {
    throw new Error(`addToDefinition failed for ${def.name}: ${JSON.stringify(alData)}`);
  }

  // The layer/table is at index 0
  return `${serviceUrl}/0`;
}

// ── Find or create WebMap "OPSMAP" in OPS folder ─────────────
export async function ensureWebMap(token, folderId, layerUrls) {
  const username = (await getPortalUser()).username;

  // Search for existing WebMap
  const webmapQ = encodeURIComponent(`title:"${WEBMAP_ITEM_TITLE}" owner:${username} type:"Web Map"`);
  const searchUrl = `${PORTAL_URL}/sharing/rest/search?q=${webmapQ}&f=json&token=${encodeURIComponent(token)}&num=5`;
  const searchResp = await fetch(searchUrl);
  const searchData = await searchResp.json();
  const existing = (searchData.results || []).find(r => r.title === WEBMAP_ITEM_TITLE);
  if (existing) return existing.id;

  // Build WebMap JSON with all operational layers
  const operationalLayers = [
    layerUrls.ao       && { id: 'ao-layer',       title: 'AO',       url: layerUrls.ao,       opacity: 1, visibility: true },
    layerUrls.missions && { id: 'missions-layer',  title: 'Oppdrag',  url: layerUrls.missions, opacity: 1, visibility: true },
    layerUrls.incidents&& { id: 'incidents-layer', title: 'Hendelser',url: layerUrls.incidents,opacity: 1, visibility: true },
    layerUrls.units    && { id: 'units-layer',     title: 'Enheter',  url: layerUrls.units,    opacity: 1, visibility: true },
  ].filter(Boolean);

  const webmapJson = {
    operationalLayers,
    baseMap: {
      baseMapLayers: [{ id: 'defaultBasemap', opacity: 1, visibility: true, url: 'https://services.geodataonline.no/arcgis/rest/services/GeocacheVector/GeocacheKanvasMork_WM/VectorTileServer' }],
      title: 'Mørkt kart (NO)',
    },
    spatialReference: { wkid: 102100 },
    authoringApp: 'OperationDashboard',
    authoringAppVersion: '1.0',
    version: '2.28',
  };

  // Create WebMap item
  const addItemUrl = `${PORTAL_URL}/sharing/rest/content/users/${username}/${folderId}/addItem`;
  const body = new URLSearchParams({
    f: 'json',
    token,
    title: WEBMAP_ITEM_TITLE,
    type: 'Web Map',
    tags: 'OPS,operations,dashboard',
    snippet: 'Operation Dashboard WebMap',
    text: JSON.stringify(webmapJson),
  });
  const addResp = await fetch(addItemUrl, { method: 'POST', body });
  const addData = await addResp.json();
  if (!addData.id) {
    throw new Error(`Failed to create WebMap: ${JSON.stringify(addData)}`);
  }
  return addData.id;
}

// ── Main entry: ensure all services exist; return URLs ────────
export async function ensureOpsServices() {
  const token = await getToken();
  const folderId = await ensureOpsFolder(token);

  const serviceKeys = ['units', 'incidents', 'missions', 'ao', 'operations'];
  const urls = {};

  for (const key of serviceKeys) {
    const def = SERVICE_DEFINITIONS[key];
    let item = await findServiceInFolder(token, def.name);
    if (item) {
      // Extract Feature Server URL and append /0
      urls[key] = item.url ? `${item.url}/0` : null;
    } else {
      console.log(`[portalService] Creating "${def.name}"…`);
      urls[key] = await createFeatureService(token, folderId, def);
    }
  }

  // Ensure WebMap exists with all layers
  const webmapId = await ensureWebMap(token, folderId, urls);

  return { urls, webmapId };
}
