/* ============================================================
   seedMigration.js — First-login seed migration
   Writes Norwegian Sword data into a freshly created set of
   ArcGIS Online Feature Services.
   ============================================================ */

import {
  saveUnits,
  saveIncidents,
  saveMissions,
  saveAO,
  saveOperationMeta,
  saveChatMessages,
  saveAlerts,
} from './featureServiceSync';
import {
  OPERATION_ID,
  OPERATION_NAME,
  SEED_CONFIG,
  UNITS_SWORD,
  MISSIONS_SWORD_STAGED,
  CHAT_SWORD,
  ALERTS_SWORD,
} from './seedData';

/**
 * Seed the Norwegian Sword operation into a freshly created set of
 * Feature Services.  Call this once after createOperationFolder().
 *
 * @param {object} serviceUrls  - { units, incidents, missions, ao, operations, chat, alerts }
 * @param {string} operationId  - override the default 'norwegian-sword' if needed
 */
export async function seedNorwegianSword(serviceUrls, operationId = OPERATION_ID) {
  const opName = OPERATION_NAME;
  const cfg    = SEED_CONFIG;

  // 1. Units
  await saveUnits(serviceUrls.units, UNITS_SWORD, operationId, opName, false);

  // 2. Incidents — staged scenario starts empty; write the staged definitions
  //    with status='staged' so the simulation engine can reference them later.
  //    We only store incidents that are pre-positioned (none initially — staged).
  // (no incidents written at seed time — they appear through the simulation)

  // 3. Missions — write staged missions with status='staged'
  const stagedMissions = MISSIONS_SWORD_STAGED.map(m => ({ ...m, status: 'staged' }));
  // Missions without a real incident position yet — use (0,0) as placeholder
  await saveMissions(serviceUrls.missions, stagedMissions, [], operationId, opName, false);

  // 4. AO polygon
  await saveAO(serviceUrls.ao, cfg.aoCoords, cfg.aoLabel, operationId, opName, false);

  // 5. Chat messages
  if (serviceUrls.chat) {
    await saveChatMessages(serviceUrls.chat, CHAT_SWORD, operationId);
  }

  // 6. Alerts
  if (serviceUrls.alerts) {
    await saveAlerts(serviceUrls.alerts, ALERTS_SWORD, operationId);
  }

  // 7. Operation metadata row
  await saveOperationMeta(serviceUrls.operations, {
    operationId,
    operationName: opName,
    center:        cfg.center,
    zoom:          cfg.zoom,
    commander:     cfg.commander,
    aoCenter:      cfg.aoCenter,
    progress:      cfg.progress,
    elapsed:       cfg.elapsed,
    created_at:    Date.now(),
    updated_at:    Date.now(),
  }, false);

  console.log('[seedMigration] Norwegian Sword seeded successfully.');
}
