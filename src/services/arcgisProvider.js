/* ============================================================
   arcgisProvider.js — ArcGIS Online-backed DataProvider
   Implements the same interface as localProvider.js.
   Activated when VITE_ARCGIS_ENABLED=true and user is signed in.
   ============================================================ */

import {
  saveOperation,
  loadOperation as loadOperationFromService,
  addFeature,
} from '../utils/featureServiceSync';
import Graphic from '@arcgis/core/Graphic';
import Point   from '@arcgis/core/geometry/Point';
import { wgs84ToUTM33N } from '../utils/coordUtils';
import { SEED_CONFIG } from '../utils/seedData';

const SR_25833 = { wkid: 25833 };

function makeUTM33Point(lat, lng) {
  const { easting, northing } = wgs84ToUTM33N(lat, lng);
  return new Point({ x: easting, y: northing, spatialReference: SR_25833 });
}

function makeUnitGraphic(unit, operationId, operationName) {
  const { easting, northing } = wgs84ToUTM33N(unit.lat, unit.lng);
  return new Graphic({
    geometry: makeUTM33Point(unit.lat, unit.lng),
    attributes: {
      Operation_id:          operationId,
      Operation_name:        operationName,
      unit_id:               unit.id,
      name:                  unit.name,
      role:                  unit.role,
      status:                unit.status,
      moving:                unit.moving ? 1 : 0,
      assigned_incident:     unit.assignedIncident || null,
      incident_color_index:  unit.incidentColorIndex ?? -1,
      x_coord:               easting,
      y_coord:               northing,
    },
  });
}

function makeIncidentGraphic(inc, operationId, operationName) {
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
}

function makeMissionGraphic(mission, incidents, operationId, operationName) {
  const inc = (incidents || []).find(i => i.id === mission.incidentId);
  const lat = inc ? inc.lat : 0;
  const lng = inc ? inc.lng : 0;
  const { easting, northing } = wgs84ToUTM33N(lat, lng);
  return new Graphic({
    geometry: makeUTM33Point(lat, lng),
    attributes: {
      Operation_id:      operationId,
      Operation_name:    operationName,
      mission_id:        mission.id,
      incident_id:       mission.incidentId,
      title:             mission.title,
      description:       mission.desc,
      status:            mission.status,
      assigned_unit_ids: (mission.assignedUnitIds || []).join(','),
      x_coord:           easting,
      y_coord:           northing,
    },
  });
}

/**
 * Create an ArcGIS Online DataProvider.
 * @param {{ units, incidents, missions, ao, operations, chat }} urls — service URLs
 * @param {string} operationName — current operation display name
 * @returns {{ load, save, addUnit, addIncident, addMission }}
 */
export function createArcGISProvider(urls, operationName) {
  const opName = operationName || SEED_CONFIG.operationName;

  return {
    /**
     * Load operation state from ArcGIS Online Feature Services.
     * @param {string} operationId
     * @returns {Promise<{ units, incidents, missions, ao, chat, meta }>}
     */
    async load(operationId) {
      const { units, incidents, missions, ao, meta, chat } =
        await loadOperationFromService(urls, operationId);
      return { units, incidents, missions, ao, chat, meta };
    },

    /**
     * Save (overwrite) a full operation snapshot to ArcGIS Online.
     * @param {object} opData
     * @param {boolean} overwrite
     * @returns {Promise<void>}
     */
    async save(opData, overwrite = false) {
      await saveOperation(urls, opData, overwrite);
    },

    /** no-op: ArcGIS provider uses save() for persistence */
    autoSave(_operationId, _data) { /* no-op */ },

    /**
     * Add a single unit to ArcGIS Online.
     */
    addUnit(unit, operationId) {
      if (!urls?.units) return;
      return addFeature(urls.units, makeUnitGraphic(unit, operationId, opName));
    },

    /**
     * Add a single incident to ArcGIS Online.
     */
    addIncident(inc, operationId) {
      if (!urls?.incidents) return;
      return addFeature(urls.incidents, makeIncidentGraphic(inc, operationId, opName));
    },

    /**
     * Add a single mission to ArcGIS Online.
     */
    addMission(mission, incidents, operationId) {
      if (!urls?.missions) return;
      return addFeature(urls.missions, makeMissionGraphic(mission, incidents, operationId, opName));
    },
  };
}
