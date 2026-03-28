/* ============================================================
   featureServiceSync.js — Read/write Feature Layer data
   Handles CRUD operations against ArcGIS Online Feature Services.
   Converts coordinates between WGS84 (app internal) and UTM33N.
   ============================================================ */

import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import { wgs84ToUTM33N, utm33NToWGS84 } from './coordUtils';

const SR_25833 = { wkid: 25833 };

// ── Lazy-init FeatureLayer references ────────────────────────
const _layers = {};

function getLayer(url) {
  if (!url) throw new Error('Feature Service URL is not set');
  if (!_layers[url]) {
    _layers[url] = new FeatureLayer({ url });
  }
  return _layers[url];
}

// ── Convert WGS84 point to UTM33N Point geometry ─────────────
function makeUTM33Point(lat, lng) {
  const { easting, northing } = wgs84ToUTM33N(lat, lng);
  return new Point({ x: easting, y: northing, spatialReference: SR_25833 });
}

// ── Delete all features with a given Operation_id ────────────
async function deleteByOperationId(fl, operationId) {
  const result = await fl.queryFeatures({
    where: opWhere(operationId),
    outFields: ['OBJECTID'],
    returnGeometry: false,
  });
  if (result.features.length > 0) {
    await fl.applyEdits({ deleteFeatures: result.features });
  }
}

// ── Escape a string for use in an ArcGIS WHERE clause ────────
function escapeWhere(value) {
  return value.replace(/'/g, "''");
}

// ── Build a WHERE clause for Operation_id filtering ──────────
function opWhere(operationId) {
  return `Operation_id = '${escapeWhere(operationId)}'`;
}

// ────────────────────────────────────────────────────────────
//  Single-Feature CRUD helpers (real-time sync)
// ────────────────────────────────────────────────────────────

/**
 * Add a single feature graphic to a Feature Layer.
 * @returns {number} the new OBJECTID
 */
export async function addFeature(url, graphic) {
  const fl = getLayer(url);
  const result = await fl.applyEdits({ addFeatures: [graphic] });
  const added = result.addFeatureResults?.[0];
  if (added?.error) throw new Error(`addFeature error: ${JSON.stringify(added.error)}`);
  return added?.objectId ?? null;
}

/**
 * Update a single feature in a Feature Layer.
 * @param {number}  objectId    - the OBJECTID to update
 * @param {object}  attributes  - attribute key/value pairs to update
 * @param {object?} geometry    - optional new geometry (Point, Polygon, …)
 */
export async function updateFeature(url, objectId, attributes, geometry = null) {
  const fl = getLayer(url);
  const graphicData = { attributes: { OBJECTID: objectId, ...attributes } };
  if (geometry) graphicData.geometry = geometry;
  const result = await fl.applyEdits({ updateFeatures: [new Graphic(graphicData)] });
  const updated = result.updateFeatureResults?.[0];
  if (updated?.error) throw new Error(`updateFeature error: ${JSON.stringify(updated.error)}`);
}

/**
 * Delete a single feature from a Feature Layer by OBJECTID.
 */
export async function deleteFeature(url, objectId) {
  const fl = getLayer(url);
  const result = await fl.applyEdits({
    deleteFeatures: [new Graphic({ attributes: { OBJECTID: objectId } })],
  });
  const deleted = result.deleteFeatureResults?.[0];
  if (deleted?.error) throw new Error(`deleteFeature error: ${JSON.stringify(deleted.error)}`);
}

// ────────────────────────────────────────────────────────────
//  Batch save helpers (initial save / overwrite)
// ────────────────────────────────────────────────────────────

// ── Check if operation already exists in a Feature Layer ─────
export async function operationExistsInLayer(url, operationId) {
  const fl = getLayer(url);
  const result = await fl.queryFeatureCount({ where: opWhere(operationId) });
  return result > 0;
}

// ── Save Units ────────────────────────────────────────────────
export async function saveUnits(url, units, operationId, operationName, overwrite = false) {
  const fl = getLayer(url);
  if (overwrite) await deleteByOperationId(fl, operationId);
  const adds = units.map(u => {
    const { easting, northing } = wgs84ToUTM33N(u.lat, u.lng);
    return new Graphic({
      geometry: makeUTM33Point(u.lat, u.lng),
      attributes: {
        Operation_id:          operationId,
        Operation_name:        operationName,
        unit_id:               u.id,
        name:                  u.name,
        role:                  u.role,
        status:                u.status,
        moving:                u.moving ? 1 : 0,
        assigned_incident:     u.assignedIncident || null,
        incident_color_index:  u.incidentColorIndex ?? -1,
        x_coord:               easting,
        y_coord:               northing,
      },
    });
  });
  if (adds.length > 0) return fl.applyEdits({ addFeatures: adds });
}

// ── Save Incidents ────────────────────────────────────────────
export async function saveIncidents(url, incidents, operationId, operationName, overwrite = false) {
  const fl = getLayer(url);
  if (overwrite) await deleteByOperationId(fl, operationId);
  const adds = incidents.map(inc => {
    const { easting, northing } = wgs84ToUTM33N(inc.lat, inc.lng);
    return new Graphic({
      geometry: makeUTM33Point(inc.lat, inc.lng),
      attributes: {
        Operation_id:   operationId,
        Operation_name: operationName,
        incident_id:    inc.id,
        title:          inc.title,
        description:    inc.desc,
        priority:       inc.priority,
        icon:           inc.icon,
        time:           inc.time || '',
        color_index:    inc.colorIndex ?? 0,
        x_coord:        easting,
        y_coord:        northing,
      },
    });
  });
  if (adds.length > 0) return fl.applyEdits({ addFeatures: adds });
}

// ── Save Missions ─────────────────────────────────────────────
export async function saveMissions(url, missions, incidents, operationId, operationName, overwrite = false) {
  const fl = getLayer(url);
  if (overwrite) await deleteByOperationId(fl, operationId);
  const adds = missions.map((m) => {
    const inc = (incidents || []).find(i => i.id === m.incidentId);
    const lat = inc ? inc.lat : 0;
    const lng = inc ? inc.lng : 0;
    const { easting, northing } = wgs84ToUTM33N(lat, lng);
    return new Graphic({
      geometry: makeUTM33Point(lat, lng),
      attributes: {
        Operation_id:      operationId,
        Operation_name:    operationName,
        mission_id:        m.id,
        incident_id:       m.incidentId,
        title:             m.title,
        description:       m.desc,
        status:            m.status,
        assigned_unit_ids: (m.assignedUnitIds || []).join(','),
        x_coord:           easting,
        y_coord:           northing,
      },
    });
  });
  if (adds.length > 0) return fl.applyEdits({ addFeatures: adds });
}

// ── Save AO Polygon ───────────────────────────────────────────
export async function saveAO(url, aoCoords, aoLabel, operationId, operationName, overwrite = false) {
  if (!aoCoords || aoCoords.length === 0) return;
  const fl = getLayer(url);
  if (overwrite) await deleteByOperationId(fl, operationId);

  const ring = aoCoords.map(([lng, lat]) => {
    const { easting, northing } = wgs84ToUTM33N(lat, lng);
    return [easting, northing];
  });

  const graphic = new Graphic({
    geometry: new Polygon({ rings: [ring], spatialReference: SR_25833 }),
    attributes: {
      Operation_id:   operationId,
      Operation_name: operationName,
      ao_label:       aoLabel,
    },
  });
  return fl.applyEdits({ addFeatures: [graphic] });
}

// ── Save Operations Table row ─────────────────────────────────
export async function saveOperationMeta(url, meta, overwrite = false) {
  const fl = getLayer(url);
  if (overwrite) await deleteByOperationId(fl, meta.operationId);
  const now = Date.now();
  const graphic = new Graphic({
    attributes: {
      Operation_id:   meta.operationId,
      Operation_name: meta.operationName,
      center_lng:     meta.center?.[0] ?? 0,
      center_lat:     meta.center?.[1] ?? 0,
      zoom:           meta.zoom ?? 12,
      commander:      meta.commander || '',
      ao_center:      meta.aoCenter || '',
      progress:       meta.progress ?? 0,
      elapsed:        meta.elapsed ?? 0,
      created_at:     meta.created_at || now,
      updated_at:     now,
    },
  });
  return fl.applyEdits({ addFeatures: [graphic] });
}

// ────────────────────────────────────────────────────────────
//  Chat helpers
// ────────────────────────────────────────────────────────────

/**
 * Batch-save an array of chat messages to OPS_Chat.
 */
export async function saveChatMessages(url, messages, operationId, overwrite = false) {
  const fl = getLayer(url);
  if (overwrite) await deleteByOperationId(fl, operationId);
  if (!messages || messages.length === 0) return;
  const adds = messages.map((m, idx) => new Graphic({
    attributes: {
      Operation_id: operationId,
      message_id:   m.id ?? idx,
      sender:       m.sender || '',
      initials:     m.initials || '',
      color:        m.color || '',
      text:         m.text || '',
      is_system:    m.system ? 1 : 0,
      is_self:      m.self ? 1 : 0,
      sent_at:      m.sentAt || Date.now(),
    },
  }));
  return fl.applyEdits({ addFeatures: adds });
}

/**
 * Add a single chat message to OPS_Chat.
 */
export async function addChatMessage(url, message, operationId) {
  const fl = getLayer(url);
  const graphic = new Graphic({
    attributes: {
      Operation_id: operationId,
      message_id:   message.id ?? Date.now(),
      sender:       message.sender || '',
      initials:     message.initials || '',
      color:        message.color || '',
      text:         message.text || '',
      is_system:    message.system ? 1 : 0,
      is_self:      message.self ? 1 : 0,
      sent_at:      message.sentAt || Date.now(),
    },
  });
  return fl.applyEdits({ addFeatures: [graphic] });
}

/**
 * Load all chat messages for an operation, ordered by sent_at.
 */
export async function loadChat(url, operationId) {
  const fl = getLayer(url);
  const result = await fl.queryFeatures({
    where: `Operation_id = '${escapeWhere(operationId)}'`,
    outFields: ['*'],
    returnGeometry: false,
    orderByFields: ['sent_at ASC'],
  });
  return result.features.map((f, idx) => {
    const a = f.attributes;
    return {
      id:       a.message_id ?? idx,
      sender:   a.sender,
      initials: a.initials,
      color:    a.color,
      text:     a.text,
      system:   a.is_system === 1,
      self:     a.is_self === 1,
      time:     a.sent_at ? new Date(a.sent_at).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' }) : '',
    };
  });
}

// ────────────────────────────────────────────────────────────
//  Alerts helpers
// ────────────────────────────────────────────────────────────

/**
 * Batch-save an array of alerts to OPS_Alerts.
 */
export async function saveAlerts(url, alerts, operationId, overwrite = false) {
  const fl = getLayer(url);
  if (overwrite) await deleteByOperationId(fl, operationId);
  if (!alerts || alerts.length === 0) return;
  const adds = alerts.map(a => new Graphic({
    attributes: {
      Operation_id: operationId,
      alert_id:     a.alert_id || a.id || String(Date.now()),
      text:         a.text || '',
      icon:         a.icon || '',
      icon_bg:      a.icon_bg || a.iconBg || '',
      icon_color:   a.icon_color || a.iconColor || '',
      severity:     a.severity || 'info',
      created_at:   a.created_at || Date.now(),
    },
  }));
  return fl.applyEdits({ addFeatures: adds });
}

/**
 * Add a single alert to OPS_Alerts.
 */
export async function addAlert(url, alert, operationId) {
  const fl = getLayer(url);
  const graphic = new Graphic({
    attributes: {
      Operation_id: operationId,
      alert_id:     alert.alert_id || alert.id || String(Date.now()),
      text:         alert.text || '',
      icon:         alert.icon || '',
      icon_bg:      alert.icon_bg || alert.iconBg || '',
      icon_color:   alert.icon_color || alert.iconColor || '',
      severity:     alert.severity || 'info',
      created_at:   alert.created_at || Date.now(),
    },
  });
  return fl.applyEdits({ addFeatures: [graphic] });
}

/**
 * Load all alerts for an operation, ordered by created_at.
 */
export async function loadAlerts(url, operationId) {
  const fl = getLayer(url);
  const result = await fl.queryFeatures({
    where: `Operation_id = '${escapeWhere(operationId)}'`,
    outFields: ['*'],
    returnGeometry: false,
    orderByFields: ['created_at ASC'],
  });
  return result.features.map(f => {
    const a = f.attributes;
    return {
      id:        a.alert_id,
      text:      a.text,
      icon:      a.icon,
      iconBg:    a.icon_bg,
      iconColor: a.icon_color,
      severity:  a.severity,
    };
  });
}

// ────────────────────────────────────────────────────────────
//  Load helpers
// ────────────────────────────────────────────────────────────

// ── Load Units from Feature Layer ────────────────────────────
export async function loadUnits(url, operationId) {
  const fl = getLayer(url);
  const result = await fl.queryFeatures({
    where: opWhere(operationId),
    outFields: ['*'],
    returnGeometry: true,
  });
  return result.features.map(f => {
    const a = f.attributes;
    const { lat, lng } = utm33NToWGS84(a.x_coord, a.y_coord);
    return {
      id:                 a.unit_id,
      name:               a.name,
      role:               a.role,
      status:             a.status,
      moving:             a.moving === 1,
      assignedIncident:   a.assigned_incident || null,
      incidentColorIndex: a.incident_color_index >= 0 ? a.incident_color_index : null,
      lat,
      lng,
      target: null,
      signal: 4,
    };
  });
}

// ── Load Incidents from Feature Layer ────────────────────────
export async function loadIncidents(url, operationId) {
  const fl = getLayer(url);
  const result = await fl.queryFeatures({
    where: opWhere(operationId),
    outFields: ['*'],
    returnGeometry: true,
  });
  return result.features.map(f => {
    const a = f.attributes;
    const { lat, lng } = utm33NToWGS84(a.x_coord, a.y_coord);
    return {
      id:         a.incident_id,
      title:      a.title,
      desc:       a.description,
      priority:   a.priority,
      icon:       a.icon,
      time:       a.time,
      colorIndex: a.color_index,
      lat,
      lng,
    };
  });
}

// ── Load Missions from Feature Layer ─────────────────────────
export async function loadMissions(url, operationId) {
  const fl = getLayer(url);
  const result = await fl.queryFeatures({
    where: opWhere(operationId),
    outFields: ['*'],
    returnGeometry: false,
  });
  return result.features.map(f => {
    const a = f.attributes;
    return {
      id:              a.mission_id,
      incidentId:      a.incident_id,
      title:           a.title,
      desc:            a.description,
      status:          a.status,
      assignedUnitIds: a.assigned_unit_ids
        ? a.assigned_unit_ids.split(',').filter(Boolean)
        : [],
    };
  });
}

// ── Load AO Polygon from Feature Layer ───────────────────────
export async function loadAO(url, operationId) {
  const fl = getLayer(url);
  const result = await fl.queryFeatures({
    where: opWhere(operationId),
    outFields: ['ao_label'],
    returnGeometry: true,
  });
  if (result.features.length === 0) return null;
  const f = result.features[0];
  const ring = f.geometry.rings[0];
  const wgs84Ring = ring.map(([x, y]) => {
    const { lat, lng } = utm33NToWGS84(x, y);
    return [lng, lat];
  });
  return { aoCoords: wgs84Ring, aoLabel: f.attributes.ao_label };
}

// ── Load operation metadata from Table ───────────────────────
export async function loadOperationMeta(url, operationId) {
  const fl = getLayer(url);
  const result = await fl.queryFeatures({
    where: opWhere(operationId),
    outFields: ['*'],
    returnGeometry: false,
  });
  if (result.features.length === 0) return null;
  const a = result.features[0].attributes;
  return {
    operationId:   a.Operation_id,
    operationName: a.Operation_name,
    center:        [a.center_lng, a.center_lat],
    zoom:          a.zoom,
    commander:     a.commander,
    aoCenter:      a.ao_center,
    progress:      a.progress,
    elapsed:       a.elapsed,
  };
}

// ── List all available operations from Operations table ──────
export async function listOperations(url) {
  const fl = getLayer(url);
  const result = await fl.queryFeatures({
    where: '1=1',
    outFields: ['Operation_id', 'Operation_name'],
    returnGeometry: false,
  });
  const seen = new Set();
  return result.features
    .map(f => ({ id: f.attributes.Operation_id, name: f.attributes.Operation_name }))
    .filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
}

// ── Load full operation (all layers) ─────────────────────────
export async function loadOperation(urls, operationId) {
  const [units, incidents, missions, ao, meta] = await Promise.all([
    loadUnits(urls.units, operationId),
    loadIncidents(urls.incidents, operationId),
    loadMissions(urls.missions, operationId),
    loadAO(urls.ao, operationId),
    loadOperationMeta(urls.operations, operationId),
  ]);
  const chat   = urls.chat   ? await loadChat(urls.chat, operationId)     : [];
  const alerts = urls.alerts ? await loadAlerts(urls.alerts, operationId) : [];
  return { units, incidents, missions, ao, meta, chat, alerts };
}

// ── Save full operation (all layers) ─────────────────────────
export async function saveOperation(urls, opData, overwrite = false) {
  const { operationId, operationName, units, incidents, missions, aoCoords, aoLabel } = opData;
  const tasks = [
    saveUnits(urls.units, units, operationId, operationName, overwrite),
    saveIncidents(urls.incidents, incidents, operationId, operationName, overwrite),
    saveMissions(urls.missions, missions, incidents, operationId, operationName, overwrite),
    saveAO(urls.ao, aoCoords, aoLabel, operationId, operationName, overwrite),
    saveOperationMeta(urls.operations, opData, overwrite),
  ];
  if (urls.chat && opData.chat)     tasks.push(saveChatMessages(urls.chat, opData.chat, operationId, overwrite));
  if (urls.alerts && opData.alerts) tasks.push(saveAlerts(urls.alerts, opData.alerts, operationId, overwrite));
  await Promise.all(tasks);
}
