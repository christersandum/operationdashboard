/* ============================================================
   portalService.js — ArcGIS Online portal management
   Handles per-operation folder creation and lookup in the
   "OPS" folder of the authenticated user's ArcGIS Online content.
   Each operation gets its own subfolder with 7 dedicated services.
   ============================================================ */

import Portal from '@arcgis/core/portal/Portal';
import IdentityManager from '@arcgis/core/identity/IdentityManager';
import { PORTAL_URL, OPS_FOLDER_NAME } from '../data';

const SR_25833 = { wkid: 25833 };

// ── Common fields shared by all Feature Layers and Tables ───
const COMMON_FIELDS = [
  { name: 'Operation_id',   type: 'esriFieldTypeString', alias: 'Operation ID',   length: 100, nullable: false },
  { name: 'Operation_name', type: 'esriFieldTypeString', alias: 'Operation Name', length: 255, nullable: true  },
];

// ── Feature Service definitions (7 per operation) ───────────
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
      { name: 'incident_id',  type: 'esriFieldTypeString',  alias: 'Incident ID', length: 50   },
      { name: 'title',        type: 'esriFieldTypeString',  alias: 'Title',       length: 255  },
      { name: 'description',  type: 'esriFieldTypeString',  alias: 'Description', length: 2000 },
      { name: 'priority',     type: 'esriFieldTypeString',  alias: 'Priority',    length: 50   },
      { name: 'icon',         type: 'esriFieldTypeString',  alias: 'Icon',        length: 20   },
      { name: 'time',         type: 'esriFieldTypeString',  alias: 'Time',        length: 20   },
      { name: 'color_index',  type: 'esriFieldTypeInteger', alias: 'Color Index'               },
      { name: 'x_coord',      type: 'esriFieldTypeDouble',  alias: 'Easting UTM33'             },
      { name: 'y_coord',      type: 'esriFieldTypeDouble',  alias: 'Northing UTM33'            },
    ],
  },
  missions: {
    name: 'OPS_Missions',
    geometryType: 'esriGeometryPoint',
    fields: [
      ...COMMON_FIELDS,
      { name: 'mission_id',        type: 'esriFieldTypeString',  alias: 'Mission ID',          length: 50   },
      { name: 'incident_id',       type: 'esriFieldTypeString',  alias: 'Incident ID',         length: 50   },
      { name: 'title',             type: 'esriFieldTypeString',  alias: 'Title',               length: 255  },
      { name: 'description',       type: 'esriFieldTypeString',  alias: 'Description',         length: 2000 },
      { name: 'status',            type: 'esriFieldTypeString',  alias: 'Status',              length: 50   },
      { name: 'assigned_unit_ids', type: 'esriFieldTypeString',  alias: 'Assigned Unit IDs',   length: 500  },
      { name: 'x_coord',           type: 'esriFieldTypeDouble',  alias: 'Easting UTM33'                     },
      { name: 'y_coord',           type: 'esriFieldTypeDouble',  alias: 'Northing UTM33'                    },
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
    geometryType: null, // table — no geometry
    fields: [
      ...COMMON_FIELDS,
      { name: 'center_lng',  type: 'esriFieldTypeDouble',  alias: 'Center Longitude'           },
      { name: 'center_lat',  type: 'esriFieldTypeDouble',  alias: 'Center Latitude'            },
      { name: 'zoom',        type: 'esriFieldTypeInteger', alias: 'Zoom Level'                 },
      { name: 'commander',   type: 'esriFieldTypeString',  alias: 'Commander',    length: 255  },
      { name: 'ao_center',   type: 'esriFieldTypeString',  alias: 'AO Center',    length: 100  },
      { name: 'progress',    type: 'esriFieldTypeInteger', alias: 'Progress (%)'               },
      { name: 'elapsed',     type: 'esriFieldTypeDouble',  alias: 'Elapsed (ms)'               },
      { name: 'created_at',  type: 'esriFieldTypeDate',    alias: 'Created At'                 },
      { name: 'updated_at',  type: 'esriFieldTypeDate',    alias: 'Updated At'                 },
    ],
  },
  chat: {
    name: 'OPS_Chat',
    geometryType: null, // table — no geometry
    fields: [
      { name: 'Operation_id', type: 'esriFieldTypeString',  alias: 'Operation ID',  length: 100  },
      { name: 'message_id',   type: 'esriFieldTypeInteger', alias: 'Message ID'                  },
      { name: 'sender',       type: 'esriFieldTypeString',  alias: 'Sender',        length: 255  },
      { name: 'initials',     type: 'esriFieldTypeString',  alias: 'Initials',      length: 10   },
      { name: 'color',        type: 'esriFieldTypeString',  alias: 'Color',         length: 20   },
      { name: 'text',         type: 'esriFieldTypeString',  alias: 'Text',          length: 2000 },
      { name: 'is_system',    type: 'esriFieldTypeInteger', alias: 'Is System'                   },
      { name: 'is_self',      type: 'esriFieldTypeInteger', alias: 'Is Self'                     },
      { name: 'sent_at',      type: 'esriFieldTypeDate',    alias: 'Sent At'                     },
    ],
  },
  alerts: {
    name: 'OPS_Alerts',
    geometryType: null, // table — no geometry
    fields: [
      { name: 'Operation_id', type: 'esriFieldTypeString',  alias: 'Operation ID',    length: 100  },
      { name: 'alert_id',     type: 'esriFieldTypeString',  alias: 'Alert ID',        length: 100  },
      { name: 'text',         type: 'esriFieldTypeString',  alias: 'Alert Text',      length: 1000 },
      { name: 'icon',         type: 'esriFieldTypeString',  alias: 'Icon',            length: 10   },
      { name: 'icon_bg',      type: 'esriFieldTypeString',  alias: 'Icon Background', length: 20   },
      { name: 'icon_color',   type: 'esriFieldTypeString',  alias: 'Icon Color',      length: 20   },
      { name: 'severity',     type: 'esriFieldTypeString',  alias: 'Severity',        length: 20   },
      { name: 'created_at',   type: 'esriFieldTypeDate',    alias: 'Created At'                    },
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

// ── Ensure the top-level "OPS" folder exists; return folder ID ─
async function ensureOpsRootFolder(token, username) {
  const url = `${PORTAL_URL}/sharing/rest/content/users/${username}?f=json&token=${token}`;
  const resp = await fetch(url);
  const data = await resp.json();
  const existing = (data.folders || []).find(f => f.title === OPS_FOLDER_NAME);
  if (existing) return existing.id;

  const createUrl = `${PORTAL_URL}/sharing/rest/content/users/${username}/createFolder`;
  const body = new URLSearchParams({ title: OPS_FOLDER_NAME, f: 'json', token });
  const createResp = await fetch(createUrl, { method: 'POST', body });
  const createData = await createResp.json();
  if (createData.folder) return createData.folder.id;
  throw new Error(`Failed to create root folder "${OPS_FOLDER_NAME}": ${JSON.stringify(createData)}`);
}

// ── Create a hosted Feature Service inside a portal folder ───
async function createFeatureService(token, username, folderId, def) {
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

// ── Create a WebMap item in the operation's folder ───────────
async function createOperationWebMap(token, username, folderId, operationName, layerUrls) {
  const operationalLayers = [
    layerUrls.ao       && { id: 'ao-layer',        title: 'AO',        url: layerUrls.ao,        opacity: 1, visibility: true },
    layerUrls.missions && { id: 'missions-layer',  title: 'Oppdrag',   url: layerUrls.missions,  opacity: 1, visibility: true },
    layerUrls.incidents&& { id: 'incidents-layer', title: 'Hendelser', url: layerUrls.incidents, opacity: 1, visibility: true },
    layerUrls.units    && { id: 'units-layer',     title: 'Enheter',   url: layerUrls.units,     opacity: 1, visibility: true },
  ].filter(Boolean);

  const webmapJson = {
    operationalLayers,
    baseMap: {
      baseMapLayers: [{
        id: 'defaultBasemap', opacity: 1, visibility: true,
        url: 'https://services.geodataonline.no/arcgis/rest/services/GeocacheVector/GeocacheKanvasMork_WM/VectorTileServer',
      }],
      title: 'Mørkt kart (NO)',
    },
    spatialReference: { wkid: 102100 },
    authoringApp: 'OperationDashboard',
    authoringAppVersion: '1.1',
    version: '2.28',
  };

  const title = `OPSMAP — ${operationName}`;
  const addItemUrl = `${PORTAL_URL}/sharing/rest/content/users/${username}/${folderId}/addItem`;
  const body = new URLSearchParams({
    f: 'json',
    token,
    title,
    type: 'Web Map',
    tags: 'OPS,operations,dashboard',
    snippet: `Operation Dashboard WebMap for ${operationName}`,
    text: JSON.stringify(webmapJson),
  });
  const addResp = await fetch(addItemUrl, { method: 'POST', body });
  const addData = await addResp.json();
  if (!addData.id) {
    throw new Error(`Failed to create WebMap for "${operationName}": ${JSON.stringify(addData)}`);
  }
  return addData.id;
}

// ── Create an operation subfolder with all 7 services + WebMap ─
/**
 * Creates OPS/<operationName>/ folder with 7 Feature Services and a WebMap.
 * Returns { folderId, urls, webmapId }.
 */
export async function createOperationFolder(operationName) {
  const token    = await getToken();
  const username = (await getPortalUser()).username;

  // Ensure OPS root folder exists (unused folderId — operations go in subfolders)
  await ensureOpsRootFolder(token, username);

  // Create the operation subfolder: title "OPS — <operationName>"
  const subfolderTitle = `OPS — ${operationName}`;
  const createUrl = `${PORTAL_URL}/sharing/rest/content/users/${username}/createFolder`;
  const body = new URLSearchParams({ title: subfolderTitle, f: 'json', token });
  const createResp = await fetch(createUrl, { method: 'POST', body });
  const createData = await createResp.json();
  if (!createData.folder) {
    throw new Error(`Failed to create operation folder "${subfolderTitle}": ${JSON.stringify(createData)}`);
  }
  const folderId = createData.folder.id;

  // Create all 7 services sequentially to avoid rate limits
  const urls = {};
  for (const key of ['units', 'incidents', 'missions', 'ao', 'operations', 'chat', 'alerts']) {
    const def = SERVICE_DEFINITIONS[key];
    console.log(`[portalService] Creating "${def.name}" in folder "${subfolderTitle}"…`);
    urls[key] = await createFeatureService(token, username, folderId, def);
  }

  // Create WebMap with the 4 spatial layers
  const webmapId = await createOperationWebMap(token, username, folderId, operationName, urls);

  return { folderId, urls, webmapId };
}

// ── List all operation subfolders inside OPS ─────────────────
/**
 * Returns array of { folderId, folderTitle, operationName } objects,
 * one for each subfolder whose title starts with "OPS — ".
 */
export async function listOperationFolders() {
  const token    = await getToken();
  const username = (await getPortalUser()).username;

  const url = `${PORTAL_URL}/sharing/rest/content/users/${username}?f=json&token=${token}`;
  const resp = await fetch(url);
  const data = await resp.json();

  return (data.folders || [])
    .filter(f => f.title && f.title.startsWith('OPS — '))
    .map(f => ({
      folderId:      f.id,
      folderTitle:   f.title,
      operationName: f.title.replace(/^OPS — /, ''),
    }));
}

// ── Get the 7 service URLs for an existing operation folder ──
/**
 * Searches the given folder for the 7 expected Feature Services and
 * returns their layer-0 URLs.
 */
export async function getOperationServiceUrls(folderId) {
  const token    = await getToken();
  const username = (await getPortalUser()).username;

  const url = `${PORTAL_URL}/sharing/rest/content/users/${username}/${folderId}?f=json&token=${token}`;
  const resp = await fetch(url);
  const data = await resp.json();

  const items = data.items || [];
  const urls  = {};

  for (const [key, def] of Object.entries(SERVICE_DEFINITIONS)) {
    const item = items.find(i => i.type === 'Feature Service' && i.title === def.name);
    if (item && item.url) {
      urls[key] = `${item.url}/0`;
    } else {
      urls[key] = null;
    }
  }

  return urls;
}

// ── Legacy stub kept for import compatibility ────────────────
// REMOVED: ensureOpsServices() deprecated stub
