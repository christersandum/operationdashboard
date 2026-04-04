/* ============================================================
   localProvider.js — localStorage-backed DataProvider
   Implements the same interface as arcgisProvider.js so the
   two can be swapped in one place (see dataProvider.js).
   ============================================================ */

import {
  UNITS_SWORD,
  CHAT_SWORD,
  SEED_CONFIG,
} from '../utils/seedData';

const LS_PREFIX = 'op_';
const LS_INDEX  = 'op_index';

// ── Internal helpers ────────────────────────────────────────

function lsKey(operationId) {
  return `${LS_PREFIX}${operationId}`;
}

function readIndex() {
  try {
    return JSON.parse(localStorage.getItem(LS_INDEX) || '[]');
  } catch {
    return [];
  }
}

function writeIndex(ids) {
  localStorage.setItem(LS_INDEX, JSON.stringify(ids));
}

function addToIndex(operationId) {
  const ids = readIndex();
  if (!ids.includes(operationId)) {
    ids.push(operationId);
    writeIndex(ids);
  }
}

function removeFromIndex(operationId) {
  const ids = readIndex().filter(id => id !== operationId);
  writeIndex(ids);
}

// ── Seed data helpers ────────────────────────────────────────

function buildSeedData() {
  return {
    operationId:   SEED_CONFIG.operationId || 'norwegian-sword',
    operationName: SEED_CONFIG.operationName,
    center:        SEED_CONFIG.center,
    zoom:          SEED_CONFIG.zoom,
    aoCoords:      SEED_CONFIG.aoCoords,
    aoLabel:       SEED_CONFIG.aoLabel,
    units:         UNITS_SWORD.map(u => ({
      ...u,
      target:             null,
      assignedIncident:   null,
      incidentColorIndex: null,
      signal:             u.signal ?? 4,
    })),
    incidents: [],
    missions:  [],
    chat:      CHAT_SWORD.map((m, i) => ({ ...m, id: i })),
    commander: SEED_CONFIG.commander,
  };
}

// ── Debounce helper ──────────────────────────────────────────

let _saveTimer = null;

function debouncedSave(operationId, data, delayMs = 2000) {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(lsKey(operationId), JSON.stringify(data));
      addToIndex(operationId);
    } catch (err) {
      console.warn('[localProvider] Could not auto-save to localStorage:', err);
    }
    _saveTimer = null;
  }, delayMs);
}

// ── Public API ───────────────────────────────────────────────

/**
 * List all operation IDs that have been saved to localStorage.
 * @returns {string[]}
 */
export function listLocalOperations() {
  return readIndex();
}

/**
 * Create a local DataProvider backed by localStorage + seed data.
 * @returns {{ load, save, autoSave, addUnit, addIncident, addMission }}
 */
export function createLocalProvider() {
  return {
    /**
     * Load operation state.
     * Checks localStorage first; falls back to seed data for 'norwegian-sword'.
     * @param {string} operationId
     * @returns {{ units, incidents, missions, ao, chat, meta }}
     */
    load(operationId) {
      const stored = localStorage.getItem(lsKey(operationId));
      if (stored) {
        try {
          const data = JSON.parse(stored);
          return {
            units:     data.units     || [],
            incidents: data.incidents || [],
            missions:  data.missions  || [],
            ao:        { aoCoords: data.aoCoords, aoLabel: data.aoLabel },
            chat:      data.chat      || [],
            meta: {
              operationId:   data.operationId,
              operationName: data.operationName,
              center:        data.center,
              zoom:          data.zoom,
            },
          };
        } catch {
          // fall through to seed
        }
      }
      // Fall back to seed data for the default operation
      const seed = buildSeedData();
      return {
        units:     seed.units,
        incidents: seed.incidents,
        missions:  seed.missions,
        ao:        { aoCoords: seed.aoCoords, aoLabel: seed.aoLabel },
        chat:      seed.chat,
        meta: {
          operationId:   seed.operationId,
          operationName: seed.operationName,
          center:        seed.center,
          zoom:          seed.zoom,
        },
      };
    },

    /**
     * Save (overwrite) a full operation snapshot to localStorage.
     * @param {object} opData
     * @returns {Promise<void>}
     */
    save(opData) {
      return new Promise((resolve, reject) => {
        try {
          localStorage.setItem(lsKey(opData.operationId), JSON.stringify(opData));
          addToIndex(opData.operationId);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    },

    /**
     * Auto-save a partial snapshot (debounced 2s).
     * @param {string} operationId
     * @param {object} data  — full operation data object
     */
    autoSave(operationId, data) {
      debouncedSave(operationId, data);
    },

    /**
     * Delete a saved operation from localStorage.
     * @param {string} operationId
     */
    delete(operationId) {
      localStorage.removeItem(lsKey(operationId));
      removeFromIndex(operationId);
    },

    // The following helpers are stubs — they exist so localProvider satisfies
    // the same interface as arcgisProvider. Real-time sync is handled via autoSave.
    addUnit(_unit, _operationId)                          { /* no-op */ },
    addIncident(_inc, _operationId)                       { /* no-op */ },
    addMission(_mission, _incidents, _operationId)        { /* no-op */ },
  };
}
