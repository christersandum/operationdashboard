/* ============================================================
   Operasjonsdashboard — app.js
   ============================================================ */

'use strict';

// ─── Nordic Shield – Enhetsdata ──────────────────────────────
const UNITS_NS = [
  { id: 'A1', name: 'Alpha-1',   role: 'Rekognosering',   status: 'online',  moving: true,  lat: 59.360, lng: 18.050, color: '#0078d4', signal: 4, target: null },
  { id: 'A2', name: 'Alpha-2',   role: 'Rekogn. støtte',  status: 'online',  moving: false, lat: 59.345, lng: 18.080, color: '#0078d4', signal: 3, target: null },
  { id: 'A3', name: 'Alpha-3',   role: 'Foroverscout',    status: 'warning', moving: true,  lat: 59.375, lng: 18.020, color: '#e74c3c', signal: 1, target: null },
  { id: 'B1', name: 'Bravo-1',   role: 'Infanterienhet',  status: 'online',  moving: true,  lat: 59.330, lng: 17.990, color: '#2ecc71', signal: 4, target: null },
  { id: 'B2', name: 'Bravo-2',   role: 'Infanterienhet',  status: 'online',  moving: false, lat: 59.320, lng: 18.030, color: '#2ecc71', signal: 4, target: null },
  { id: 'B3', name: 'Bravo-3',   role: 'Støtteenhet',     status: 'online',  moving: true,  lat: 59.310, lng: 18.070, color: '#2ecc71', signal: 3, target: null },
  { id: 'B4', name: 'Bravo-4',   role: 'Medisinsk enhet', status: 'online',  moving: false, lat: 59.300, lng: 18.100, color: '#2ecc71', signal: 4, target: null },
  { id: 'B7', name: 'Bravo-7',   role: 'Logistikk',       status: 'warning', moving: false, lat: 59.355, lng: 18.130, color: '#f39c12', signal: 2, target: null },
  { id: 'C1', name: 'Charlie-1', role: 'Kommandopost',    status: 'online',  moving: false, lat: 59.338, lng: 18.065, color: '#9b59b6', signal: 4, target: null },
  { id: 'C2', name: 'Charlie-2', role: 'HK-støtte',       status: 'online',  moving: false, lat: 59.335, lng: 18.060, color: '#9b59b6', signal: 4, target: null },
  { id: 'D1', name: 'Delta-1',   role: 'EOD-team',        status: 'online',  moving: true,  lat: 59.380, lng: 18.090, color: '#f39c12', signal: 3, target: null },
  { id: 'D2', name: 'Delta-2',   role: 'EOD-støtte',      status: 'warning', moving: false, lat: 59.385, lng: 18.100, color: '#e74c3c', signal: 3, target: null },
  { id: 'E1', name: 'Echo-1',    role: 'Flyliaison',      status: 'online',  moving: true,  lat: 59.295, lng: 17.980, color: '#1abc9c', signal: 4, target: null },
  { id: 'E2', name: 'Echo-2',    role: 'Flystøtte',       status: 'offline', moving: false, lat: 59.290, lng: 17.970, color: '#6b7280', signal: 0, target: null },
];

const INCIDENTS_NS = [
  { id: 'HEN-001', title: 'Mistenkelig kjøretøy observert', desc: 'Rutenett 59.370/18.030 — uidentifisert kjøretøykolonne', priority: 'high',   time: '10:14', icon: '🚨', lat: 59.370, lng: 18.030 },
  { id: 'HEN-002', title: 'Kommunikasjonssvikt',            desc: 'Alpha-3 mistet kontakt i 12 min — mulig jamming',        priority: 'high',   time: '10:22', icon: '📡', lat: 59.375, lng: 18.020 },
  { id: 'HEN-003', title: 'Sivil evakuering nødvendig',     desc: 'Sektor 4 — ca. 30 sivile trenger assistanse',            priority: 'medium', time: '10:31', icon: '👥', lat: 59.315, lng: 18.040 },
  { id: 'HEN-004', title: 'Mistanke om IED — Vei stengt',   desc: 'Nordlig innfartsrute blokkert — EOD utsendt',            priority: 'high',   time: '10:45', icon: '💣', lat: 59.382, lng: 18.095 },
  { id: 'HEN-005', title: 'Forsyningsrute forsinket',       desc: 'Bravo-7 melder 40 min forsinkelse pga. veiforhold',      priority: 'low',    time: '10:53', icon: '🚚', lat: 59.355, lng: 18.130 },
  { id: 'HEN-006', title: 'Medisinsk nødsituasjon',         desc: 'Én skadet ved Bravo-4 posisjon — medevak anmodet',       priority: 'medium', time: '11:02', icon: '🏥', lat: 59.300, lng: 18.100 },
];

const CHAT_NS = [
  { id: 1,  sender: 'System',           initials: '⚙',  color: '#6b7280', self: false, system: true, time: '09:00', text: 'Operation Nordic Shield — Oppdraget startet. Alle enheter meld inn.' },
  { id: 2,  sender: 'Oberst Bergström', initials: 'CB', color: '#0078d4', self: false, time: '09:01', text: 'Alle enheter stand-by. Alpha-lag beveger seg til angitt rutenett.' },
  { id: 3,  sender: 'Alpha-1',          initials: 'A1', color: '#0078d4', self: false, time: '09:04', text: 'Alpha-1 i posisjon. AO klar. Starter rekognosering.' },
  { id: 4,  sender: 'Bravo-1',          initials: 'B1', color: '#2ecc71', self: false, time: '09:08', text: 'Bravo-lag krysser sektor 3. Ingen kontakt.' },
  { id: 5,  sender: 'Deg',              initials: 'AU', color: '#0078d4', self: true,  time: '09:12', text: 'Bekreft — alle Bravo-elementer holder radiokontakt hvert 15. minutt.' },
  { id: 6,  sender: 'Bravo-1',          initials: 'B1', color: '#2ecc71', self: false, time: '09:13', text: 'Forstått. Vil etterkomme.' },
  { id: 7,  sender: 'Delta-1',          initials: 'D1', color: '#f39c12', self: false, time: '10:45', text: '⚠ IED mistenkt på nordlig vei. EOD-team på vei. Område avsperret.' },
  { id: 8,  sender: 'Deg',              initials: 'AU', color: '#0078d4', self: true,  time: '10:46', text: 'Alle enheter unngå nordlig innfart. Omdiriger via sektor 2. Delta-1 — bekreft ETA.' },
  { id: 9,  sender: 'Delta-1',          initials: 'D1', color: '#f39c12', self: false, time: '10:48', text: 'ETA 12 minutter. Anmoder luftovervåking.' },
  { id: 10, sender: 'Alpha-3',          initials: 'A3', color: '#e74c3c', self: false, time: '10:52', text: '🔴 Kontakt midlertidig tapt — samband gjenopprettet. Mulig jamming i rutenett 59.37.' },
];

// ─── Norwegian Sword – Enhetsdata ────────────────────────────
const NS_BANK_LAT = 59.913;
const NS_BANK_LNG = 10.741;

const UNITS_SWORD = [
  { id: 'P1', name: 'Patrulje-1',  role: 'Politipatrulje',  status: 'online', moving: false, lat: 59.940, lng: 10.710, color: '#0078d4', signal: 4, target: null },
  { id: 'P2', name: 'Patrulje-2',  role: 'Politipatrulje',  status: 'online', moving: false, lat: 59.897, lng: 10.785, color: '#0078d4', signal: 4, target: null },
  { id: 'P3', name: 'Patrulje-3',  role: 'Politipatrulje',  status: 'online', moving: false, lat: 59.930, lng: 10.765, color: '#0078d4', signal: 3, target: null },
  { id: 'P4', name: 'Patrulje-4',  role: 'Politipatrulje',  status: 'online', moving: false, lat: 59.885, lng: 10.720, color: '#0078d4', signal: 4, target: null },
  { id: 'D1', name: 'Delta-1',     role: 'Beredskapstropp', status: 'online', moving: false, lat: 59.918, lng: 10.740, color: '#e74c3c', signal: 4, target: null },
  { id: 'D2', name: 'Delta-2',     role: 'Beredskapstropp', status: 'online', moving: false, lat: 59.905, lng: 10.760, color: '#e74c3c', signal: 4, target: null },
  { id: 'T1', name: 'Taktisk-1',   role: 'Taktisk team',    status: 'online', moving: false, lat: 59.915, lng: 10.790, color: '#9b59b6', signal: 4, target: null },
  { id: 'T2', name: 'Taktisk-2',   role: 'Taktisk team',    status: 'online', moving: false, lat: 59.895, lng: 10.698, color: '#9b59b6', signal: 3, target: null },
  { id: 'K1', name: 'Kommando-1',  role: 'Kommandopost',    status: 'online', moving: false, lat: 59.920, lng: 10.730, color: '#f39c12', signal: 4, target: null },
  { id: 'L1', name: 'Lege-1',      role: 'Medisinsk enhet', status: 'online', moving: false, lat: 59.902, lng: 10.750, color: '#2ecc71', signal: 4, target: null },
  { id: 'U1', name: 'Utrykning-1', role: 'Utrykkingsenhet', status: 'online', moving: false, lat: 59.935, lng: 10.750, color: '#1abc9c', signal: 4, target: null },
  { id: 'E1', name: 'ETS-1',       role: 'Etterretning',    status: 'online', moving: false, lat: 59.910, lng: 10.708, color: '#f1c40f', signal: 4, target: null },
];

// Trinnvise hendelser — vises sekvensielt med tidsforsinkelse
const INCIDENTS_SWORD_STAGED = [
  {
    id: 'HEN-001', title: 'Bil i brann', icon: '🔥',
    desc: 'Grønland — bil bevisst satt i brann nær T-banestasjonen',
    priority: 'high', lat: 59.907, lng: 10.762, delay: 10000,
    assignedUnits: ['P2', 'T1'],
  },
  {
    id: 'HEN-002', title: 'Kjøretøy sperrer vei', icon: '🚛',
    desc: 'Majorstua — lastebil etterlatt og blokkerer E18 i begge retninger',
    priority: 'medium', lat: 59.926, lng: 10.715, delay: 25000,
    assignedUnits: ['P1', 'P3'],
  },
  {
    id: 'HEN-003', title: 'Eksplosjon rapportert', icon: '💥',
    desc: 'Bryn — improvisert sprenglegeme detonert ved bensinstasjon',
    priority: 'high', lat: 59.891, lng: 10.816, delay: 40000,
    assignedUnits: ['D1', 'D2'],
  },
  {
    id: 'HEN-004', title: 'Person overfalt', icon: '🚨',
    desc: 'Skøyen — person angrepet av gruppe på tre menn, vitner på stedet',
    priority: 'high', lat: 59.892, lng: 10.690, delay: 55000,
    assignedUnits: ['T2', 'P4'],
  },
  {
    id: 'HEN-005', title: '🏦 BANKRØVERI PÅGÅR', icon: '🏦',
    desc: 'Oslo sentrum — Storgata Bank — bevæpnet ran pågår. ALLE ENHETER TIL STEDET UMIDDELBART!',
    priority: 'high', lat: NS_BANK_LAT, lng: NS_BANK_LNG, delay: 75000,
    assignedUnits: null,
  },
];

const CHAT_SWORD = [
  { id: 1, sender: 'System',             initials: '⚙',  color: '#6b7280', self: false, system: true, time: '07:30', text: 'Operasjon Norwegian Sword — Alle enheter meldt inn og klare.' },
  { id: 2, sender: 'PolitiInsp. Hansen', initials: 'KH', color: '#0078d4', self: false, time: '07:31', text: 'Alle enheter stand-by. Vi har etterretning om mulig organisert kriminalitet i Oslo-sentrum i dag.' },
  { id: 3, sender: 'Patrulje-1',         initials: 'P1', color: '#0078d4', self: false, time: '07:35', text: 'P1 i posisjon. Starter patruljering nord i AO.' },
  { id: 4, sender: 'Delta-1',            initials: 'D1', color: '#e74c3c', self: false, time: '07:40', text: 'Delta-team klart. Avventer ordre fra kommandopost.' },
  { id: 5, sender: 'Deg',                initials: 'AU', color: '#0078d4', self: true,  time: '07:45', text: 'Bekreft — alle enheter holder radiokontakt hvert 10. minutt.' },
  { id: 6, sender: 'Kommando-1',         initials: 'K1', color: '#f39c12', self: false, time: '07:46', text: 'Kommandopost er operativ. Overvåker alle sektorer.' },
];

// ─── Operasjonskonfigurasjon ──────────────────────────────────
const OPERATION_CONFIG = {
  'nordic-shield': {
    name: 'OPERATION NORDIC SHIELD',
    center: [59.338, 18.065],
    zoom: 11,
    aoCoords: [[59.40, 17.95], [59.40, 18.15], [59.28, 18.15], [59.28, 17.95]],
    aoLabel: 'AO — Nordic Shield',
    commander: 'Oberst A. Bergström',
    aoCenter: '59.33°N 18.07°E',
    progress: 62,
    elapsed: 2 * 3600000 + 12 * 60000,
    units: UNITS_NS,
    incidents: INCIDENTS_NS,
    chat: CHAT_NS,
    staged: false,
    stats: { units: 14, incidents: 4, tasks: 9, alerts: 3 },
    alerts: [
      { icon: '⚠',  iconBg: 'rgba(231,76,60,0.15)',  iconColor: 'var(--accent-red)',    text: 'Alpha-3 utenfor kommunikasjonssone',  time: '2 min siden'  },
      { icon: '��', iconBg: 'rgba(243,156,18,0.15)', iconColor: 'var(--accent-orange)', text: 'Svakt signal: Bravo-7',               time: '8 min siden'  },
      { icon: '🔋', iconBg: 'rgba(241,196,15,0.15)', iconColor: 'var(--accent-yellow)', text: 'Batteriadvarsel: Delta-2 (18%)',      time: '15 min siden' },
    ],
  },
  'norwegian-sword': {
    name: 'OPERASJON NORWEGIAN SWORD',
    center: [59.913, 10.741],
    zoom: 12,
    aoCoords: [[59.97, 10.55], [59.97, 10.93], [59.84, 10.93], [59.84, 10.55]],
    aoLabel: 'AO — Norwegian Sword',
    commander: 'Politiinspektør K. Hansen',
    aoCenter: '59.91°N 10.74°E',
    progress: 15,
    elapsed: 30 * 60000,
    units: UNITS_SWORD,
    incidents: [],
    chat: CHAT_SWORD,
    staged: true,
    stats: { units: 12, incidents: 0, tasks: 5, alerts: 1 },
    alerts: [
      { icon: '⚠', iconBg: 'rgba(243,156,18,0.15)', iconColor: 'var(--accent-orange)', text: 'Økt kriminalaktivitet rapportert i sentrum', time: '5 min siden' },
    ],
  },
};

// ─── Tilstand ─────────────────────────────────────────────────
let map;
const unitMarkers     = {};
const incidentMarkers = {};
let aoLayer        = null;
let unreadChat     = 2;
let unreadIncidents = 4;
let missionStartTime;
let filterUnit     = 'all';
let filterIncident = 'all';
let currentOpId    = 'nordic-shield';
let currentUnits   = [];
let currentIncidents = [];
let CHAT_HISTORY   = [];
let nsSimTimers    = [];
let darkTileLayer  = null;
let lightTileLayer = null;
let currentBasemap = 'dark';

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initMap();
  loadOperation('nordic-shield');
  initTabs();
  initSearch();
  initFilterPills();
  initChatInput();
  initBroadcast();
  initMapToolbar();
  initOperationDropdown();
  initBasemapToggle();
  setInterval(updateMissionDuration, 10000);
  setInterval(simulateMovement, 3000);
  setTimeout(() => receiveMessage({
    sender: 'Charlie-1', initials: 'C1', color: '#9b59b6',
    text: 'KP melder alle sektorer grønne. Avventer neste orientering.',
  }), 12000);
});

// ─── Klokke ───────────────────────────────────────────────────
function initClock() {
  function tick() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    document.getElementById('clock').textContent =
      `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} UTC`;
    document.getElementById('clockDate').textContent =
      now.toLocaleDateString('nb-NO', { day: '2-digit', month: 'short' });
    const startHour = missionStartTime ? new Date(missionStartTime).getHours() : 0;
    const startMin  = missionStartTime ? new Date(missionStartTime).getMinutes() : 0;
    document.getElementById('missionStart').textContent =
      missionStartTime ? `${pad(startHour)}:${pad(startMin)} UTC` : '--';
  }
  tick();
  setInterval(tick, 1000);
}

function updateMissionDuration() {
  const elapsed = Date.now() - missionStartTime;
  const h = Math.floor(elapsed / 3600000);
  const m = Math.floor((elapsed % 3600000) / 60000);
  document.getElementById('missionDuration').textContent = `${h}t ${m}m`;
}

// ─── Kart ─────────────────────────────────────────────────────
function initMap() {
  map = L.map('map', {
    center: [59.338, 18.065],
    zoom: 11,
    zoomControl: true,
  });

  darkTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CartoDB',
    subdomains: 'abcd',
    maxZoom: 19,
  });
  lightTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CartoDB',
    subdomains: 'abcd',
    maxZoom: 19,
  });

  darkTileLayer.addTo(map);
  currentBasemap = 'dark';

  map.on('mousemove', e => {
    document.getElementById('mapCoords').innerHTML =
      `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
      ${e.latlng.lat.toFixed(4)}°N ${e.latlng.lng.toFixed(4)}°E`;
  });

  map.on('zoomend', () => {
    document.getElementById('mapZoom').innerHTML =
      `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      Zoom: ${map.getZoom()}`;
  });
}

// ─── Last operasjon ───────────────────────────────────────────
function loadOperation(opId) {
  // Avbryt pågående tidsstyrte hendelser
  nsSimTimers.forEach(clearTimeout);
  nsSimTimers = [];

  // Fjern eksisterende markører
  Object.values(unitMarkers).forEach(({ marker }) => map.removeLayer(marker));
  Object.values(incidentMarkers).forEach(marker => map.removeLayer(marker));
  Object.keys(unitMarkers).forEach(k => delete unitMarkers[k]);
  Object.keys(incidentMarkers).forEach(k => delete incidentMarkers[k]);

  if (aoLayer) { map.removeLayer(aoLayer); aoLayer = null; }

  currentOpId = opId;
  const op = OPERATION_CONFIG[opId];

  document.getElementById('missionName').textContent   = op.name;
  document.getElementById('missionAoCenter').textContent = op.aoCenter;
  document.getElementById('commanderName').textContent = op.commander;

  map.setView(op.center, op.zoom, { animate: true });

  aoLayer = L.polygon(op.aoCoords, {
    color: '#0078d4', weight: 1.5, opacity: 0.6,
    fillColor: '#0078d4', fillOpacity: 0.05, dashArray: '5 5',
  }).addTo(map).bindTooltip(op.aoLabel, { permanent: false });

  currentUnits     = op.units.map(u => ({ ...u, target: null }));
  currentIncidents = op.staged ? [] : op.incidents.map(i => ({ ...i }));

  currentUnits.forEach(addUnitMarker);
  currentIncidents.forEach(addIncidentMarker);

  updateStats(op.stats);
  renderAlerts(op.alerts);

  document.getElementById('missionProgressBar').style.width = op.progress + '%';
  document.getElementById('missionProgressPct').textContent  = op.progress + '%';
  document.getElementById('mapUnitCount').textContent        = `${currentUnits.length} enheter spores`;

  CHAT_HISTORY.length = 0;
  op.chat.forEach(m => CHAT_HISTORY.push(m));
  renderChat();

  unreadIncidents = currentIncidents.length;
  document.getElementById('incidentBadge').textContent    = unreadIncidents;
  document.getElementById('incidentBadge').style.display  = unreadIncidents > 0 ? '' : 'none';

  filterUnit = 'all';
  filterIncident = 'all';
  document.querySelectorAll('#tab-participants .filter-pill').forEach(p =>
    p.classList.toggle('active', p.dataset.filter === 'all'));
  document.querySelectorAll('#tab-incidents .filter-pill').forEach(p =>
    p.classList.toggle('active', p.dataset.filter === 'all'));
  renderParticipants();
  renderIncidents();

  missionStartTime = Date.now() - (op.elapsed || 0);
  updateMissionDuration();

  if (op.staged) startStagedSimulation();
}

// ─── Trinnvis simulering (Norwegian Sword) ───────────────────
function startStagedSimulation() {
  INCIDENTS_SWORD_STAGED.forEach(incData => {
    const timer = setTimeout(() => {
      if (currentOpId !== 'norwegian-sword') return;

      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

      const inc = {
        id: incData.id, title: incData.title, desc: incData.desc,
        priority: incData.priority, time: timeStr,
        icon: incData.icon, lat: incData.lat, lng: incData.lng,
      };
      currentIncidents.push(inc);
      addIncidentMarker(inc);
      renderIncidents();

      if (!document.getElementById('tab-incidents').classList.contains('active')) {
        unreadIncidents++;
        document.getElementById('incidentBadge').textContent    = unreadIncidents;
        document.getElementById('incidentBadge').style.display  = '';
      }
      document.getElementById('stat-incidents').textContent = currentIncidents.length;

      if (incData.assignedUnits === null) {
        currentUnits.forEach(u => {
          if (u.status !== 'offline') {
            u.target  = { lat: incData.lat, lng: incData.lng };
            u.moving  = true;
          }
        });
        receiveMessage({
          sender: 'System', initials: '⚙', color: '#e74c3c', system: true,
          text: `🚨🏦 BANKRØVERI PÅGÅR — Storgata Bank — ALLE ENHETER RYK UT NÅ!`,
        });
      } else {
        incData.assignedUnits.forEach(uid => {
          const u = currentUnits.find(x => x.id === uid);
          if (u && u.status !== 'offline') {
            u.target = { lat: incData.lat, lng: incData.lng };
            u.moving = true;
          }
        });
        receiveMessage({
          sender: 'System', initials: '⚙', color: '#6b7280', system: true,
          text: `🚨 Ny hendelse: ${incData.title} — ${incData.desc}`,
        });
      }
    }, incData.delay);
    nsSimTimers.push(timer);
  });
}

// ─── Statistikk og varsler ────────────────────────────────────
function updateStats(stats) {
  document.getElementById('stat-units').textContent     = stats.units;
  document.getElementById('stat-incidents').textContent = stats.incidents;
  document.getElementById('stat-tasks').textContent     = stats.tasks;
  document.getElementById('stat-alerts').textContent    = stats.alerts;
}

function renderAlerts(alerts) {
  const container = document.getElementById('alertList');
  container.innerHTML = '';
  alerts.forEach(a => {
    const div = document.createElement('div');
    div.className = 'alert-item';
    div.innerHTML = `
      <div class="alert-icon" style="background:${a.iconBg}; color:${a.iconColor};">${a.icon}</div>
      <div class="alert-body">
        <div class="alert-text">${a.text}</div>
        <div class="alert-time">${a.time}</div>
      </div>`;
    container.appendChild(div);
  });
}

// ─── Markørfunksjoner ─────────────────────────────────────────
function makeMarkerIcon(unit) {
  const statusColor = unit.status === 'online' ? '#2ecc71'
    : unit.status === 'warning' ? '#f39c12' : '#6b7280';
  const html = `
    <div style="
      width:34px; height:34px; border-radius:50%;
      background:${unit.color}; border:2.5px solid ${statusColor};
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:10px; font-weight:700;
      box-shadow:0 2px 8px rgba(0,0,0,0.55); cursor:pointer;
    ">${unit.id}</div>`;
  return L.divIcon({ html, className: '', iconSize: [34, 34], iconAnchor: [17, 17] });
}

function addUnitMarker(unit) {
  const marker = L.marker([unit.lat, unit.lng], { icon: makeMarkerIcon(unit) })
    .addTo(map)
    .bindPopup(makeUnitPopup(unit), { maxWidth: 220 });
  unitMarkers[unit.id] = { marker, unit };
}

function makeUnitPopup(unit) {
  const statusText  = unit.status === 'online' ? 'Online'
    : unit.status === 'warning' ? 'Advarsel' : 'Offline';
  const statusColor = unit.status === 'online' ? '#2ecc71'
    : unit.status === 'warning' ? '#f39c12' : '#6b7280';
  return `
    <div class="popup-content">
      <div class="popup-header">
        <div style="width:28px;height:28px;border-radius:50%;background:${unit.color};
          display:flex;align-items:center;justify-content:center;
          font-size:10px;font-weight:700;color:#fff;">${unit.id}</div>
        <div>
          <div class="popup-title">${unit.name}</div>
          <div style="font-size:10px;color:var(--text-muted)">${unit.role}</div>
        </div>
      </div>
      <div class="popup-row"><span class="label">Status</span>
        <span class="value" style="color:${statusColor}">${statusText}</span></div>
      <div class="popup-row"><span class="label">Posisjon</span>
        <span class="value">${unit.lat.toFixed(3)}°N ${unit.lng.toFixed(3)}°E</span></div>
      <div class="popup-row"><span class="label">Beveger seg</span>
        <span class="value">${unit.moving ? 'Ja' : 'Stasjonær'}</span></div>
    </div>`;
}

function addIncidentMarker(inc) {
  const priorityColor = inc.priority === 'high' ? '#e74c3c'
    : inc.priority === 'medium' ? '#f39c12' : '#2ecc71';
  const priorityLabel = inc.priority === 'high' ? 'HØY'
    : inc.priority === 'medium' ? 'MEDIUM' : 'LAV';
  const html = `
    <div style="
      width:28px; height:28px; border-radius:6px;
      background:${priorityColor}22; border:2px solid ${priorityColor};
      display:flex; align-items:center; justify-content:center;
      font-size:13px; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.4);
    ">${inc.icon}</div>`;
  const icon = L.divIcon({ html, className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
  const marker = L.marker([inc.lat, inc.lng], { icon })
    .addTo(map)
    .bindPopup(`
      <div class="popup-content">
        <div class="popup-header">
          <span style="font-size:18px">${inc.icon}</span>
          <div>
            <div class="popup-title">${inc.title}</div>
            <div style="font-size:10px;color:var(--text-muted)">${inc.id} · ${inc.time || '--'}</div>
          </div>
        </div>
        <div class="popup-row"><span class="label">Prioritet</span>
          <span class="value" style="color:${priorityColor}">${priorityLabel}</span></div>
        <div style="font-size:11px;color:var(--text-secondary);margin-top:4px">${inc.desc}</div>
      </div>`, { maxWidth: 240 });
  incidentMarkers[inc.id] = marker;
}

// ─── Deltakerliste ────────────────────────────────────────────
function renderParticipants(query = '', filter = 'all') {
  const container = document.getElementById('participantList');
  container.innerHTML = '';

  const filtered = currentUnits.filter(u => {
    const matchQ = !query
      || u.name.toLowerCase().includes(query.toLowerCase())
      || u.role.toLowerCase().includes(query.toLowerCase())
      || u.id.toLowerCase().includes(query.toLowerCase());
    const matchF = filter === 'all'
      || (filter === 'online'  && u.status === 'online')
      || (filter === 'moving'  && u.moving)
      || (filter === 'offline' && u.status === 'offline');
    return matchQ && matchF;
  });

  const groups = { online: [], warning: [], offline: [] };
  filtered.forEach(u => {
    if (groups[u.status]) groups[u.status].push(u);
    else groups.online.push(u);
  });

  const groupLabels = {
    online:  'Online',
    warning: 'Advarsel / Lavt signal',
    offline: 'Offline',
  };
  let total = 0;

  Object.entries(groups).forEach(([status, units]) => {
    if (!units.length) return;
    const header = document.createElement('div');
    header.className = 'group-header';
    const dot   = status === 'online' ? '●' : status === 'warning' ? '▲' : '○';
    const color = status === 'online' ? '#2ecc71' : status === 'warning' ? '#f39c12' : '#6b7280';
    header.innerHTML =
      `<span style="color:${color}">${dot} ${groupLabels[status]}</span><span>${units.length}</span>`;
    container.appendChild(header);
    units.forEach(u => { total++; container.appendChild(buildParticipantItem(u)); });
  });

  if (!filtered.length) {
    container.innerHTML =
      '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;">Ingen enheter funnet</div>';
  }
  document.getElementById('participantCount').textContent =
    `${total} ${filter === 'all' ? 'enheter' : filter}`;
}

function buildParticipantItem(unit) {
  const el = document.createElement('div');
  el.className  = 'participant-item';
  el.dataset.id = unit.id;

  const statusColor = unit.status === 'online' ? '#2ecc71'
    : unit.status === 'warning' ? '#f39c12' : '#6b7280';

  let signalBars = '';
  for (let i = 1; i <= 4; i++) {
    const h      = 4 + (i * 3);
    const active = i <= unit.signal ? ' active' : '';
    signalBars  += `<div class="signal-bar${active}" style="height:${h}px;"></div>`;
  }

  el.innerHTML = `
    <div class="participant-avatar" style="background:${unit.color}">
      ${unit.id}
      <div class="participant-status-dot" style="background:${statusColor}"></div>
    </div>
    <div class="participant-info">
      <div class="participant-name">${unit.name}</div>
      <div class="participant-role">${unit.role}${unit.moving ? ' · Beveger seg' : ''}</div>
    </div>
    <div class="participant-meta">
      <div class="participant-time">${unit.status === 'offline' ? 'Offline' : 'Live'}</div>
      <div class="participant-signal">${signalBars}</div>
    </div>`;

  el.addEventListener('click', () => {
    document.querySelectorAll('.participant-item').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');
    if (unitMarkers[unit.id]) {
      map.setView([unit.lat, unit.lng], 13, { animate: true });
      unitMarkers[unit.id].marker.openPopup();
    }
  });
  return el;
}

// ─── Hendelsesliste ───────────────────────────────────────────
function renderIncidents(query = '', filter = 'all') {
  const container = document.getElementById('incidentList');
  container.innerHTML = '';

  const filtered = currentIncidents.filter(inc => {
    const matchQ = !query
      || inc.title.toLowerCase().includes(query.toLowerCase())
      || inc.id.toLowerCase().includes(query.toLowerCase());
    const matchF = filter === 'all' || inc.priority === filter;
    return matchQ && matchF;
  });

  if (!filtered.length) {
    container.innerHTML =
      '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;">Ingen hendelser funnet</div>';
    return;
  }

  filtered.forEach(inc => {
    const el = document.createElement('div');
    el.className = 'incident-item';
    const priorityColor = inc.priority === 'high' ? 'var(--accent-red)'
      : inc.priority === 'medium' ? 'var(--accent-orange)' : 'var(--accent-green)';
    const priorityLabel = inc.priority === 'high' ? 'høy'
      : inc.priority === 'medium' ? 'medium' : 'lav';
    el.innerHTML = `
      <div class="incident-icon"
        style="background:${priorityColor}1a; border:1px solid ${priorityColor}44">${inc.icon}</div>
      <div class="incident-info">
        <div class="incident-title">${inc.title}</div>
        <div class="incident-desc">${inc.desc}</div>
      </div>
      <div class="incident-meta">
        <div class="incident-time">${inc.time || '--'}</div>
        <div class="priority-badge priority-${inc.priority}">${priorityLabel}</div>
      </div>`;
    el.addEventListener('click', () => {
      map.setView([inc.lat, inc.lng], 14, { animate: true });
      if (incidentMarkers[inc.id]) incidentMarkers[inc.id].openPopup();
    });
    container.appendChild(el);
  });

  document.getElementById('incidentCount').textContent = `${filtered.length} åpne`;
}

// ─── Chat ─────────────────────────────────────────────────────
function renderChat() {
  const container = document.getElementById('chatMessages');
  container.innerHTML = '';
  let lastDate = null;
  CHAT_HISTORY.forEach(msg => {
    const msgDate = 'I dag';
    if (msgDate !== lastDate) {
      const div = document.createElement('div');
      div.className   = 'chat-date-divider';
      div.textContent = msgDate;
      container.appendChild(div);
      lastDate = msgDate;
    }
    container.appendChild(buildChatMessage(msg));
  });
  container.scrollTop = container.scrollHeight;
}

function buildChatMessage(msg) {
  const el = document.createElement('div');
  el.className = `chat-msg${msg.self ? ' self' : ''}`;
  if (msg.system) {
    el.innerHTML =
      `<div class="chat-msg-bubble system" style="width:100%;text-align:center;">${msg.text}</div>`;
    return el;
  }
  el.innerHTML = `
    <div class="chat-msg-avatar" style="background:${msg.color}">${msg.initials}</div>
    <div class="chat-msg-body">
      <div class="chat-msg-header">
        <span class="chat-msg-name">${msg.sender}</span>
        <span class="chat-msg-time">${msg.time}</span>
      </div>
      <div class="chat-msg-bubble">${msg.text}</div>
    </div>`;
  return el;
}

function receiveMessage(msg) {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const fullMsg = { ...msg, self: false, time };
  CHAT_HISTORY.push(fullMsg);
  const container = document.getElementById('chatMessages');
  container.appendChild(buildChatMessage(fullMsg));
  container.scrollTop = container.scrollHeight;
  if (!document.getElementById('tab-chat').classList.contains('active')) {
    unreadChat++;
    document.getElementById('chatBadge').textContent   = unreadChat;
    document.getElementById('chatBadge').style.display = '';
  }
}

// ─── Operasjonsveksler ────────────────────────────────────────
function initOperationDropdown() {
  const select = document.getElementById('operationSelect');
  select.addEventListener('change', e => {
    loadOperation(e.target.value);
  });
}

// ─── Faner ────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tabId}`).classList.add('active');
      if (tabId === 'chat') {
        unreadChat = 0;
        document.getElementById('chatBadge').style.display = 'none';
      }
      if (tabId === 'incidents') {
        unreadIncidents = 0;
        document.getElementById('incidentBadge').style.display = 'none';
      }
    });
  });
}

// ─── Søk ─────────────────────────────────────────────────────
function initSearch() {
  document.getElementById('participantSearch').addEventListener('input', e => {
    renderParticipants(e.target.value, filterUnit);
  });
  document.getElementById('incidentSearch').addEventListener('input', e => {
    renderIncidents(e.target.value, filterIncident);
  });
}

// ─── Filterknapper ────────────────────────────────────────────
function initFilterPills() {
  document.querySelectorAll('#tab-participants .filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#tab-participants .filter-pill')
        .forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      filterUnit = pill.dataset.filter;
      renderParticipants(document.getElementById('participantSearch').value, filterUnit);
    });
  });
  document.querySelectorAll('#tab-incidents .filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#tab-incidents .filter-pill')
        .forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      filterIncident = pill.dataset.filter;
      renderIncidents(document.getElementById('incidentSearch').value, filterIncident);
    });
  });
}

// ─── Chatinput ────────────────────────────────────────────────
function initChatInput() {
  const input   = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');

  function sendMsg() {
    const text = input.value.trim();
    if (!text) return;
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const msg = { sender: 'Deg', initials: 'AU', color: '#0078d4', self: true, time, text };
    CHAT_HISTORY.push(msg);
    const container = document.getElementById('chatMessages');
    container.appendChild(buildChatMessage(msg));
    container.scrollTop = container.scrollHeight;
    input.value       = '';
    input.style.height = 'auto';
  }

  sendBtn.addEventListener('click', sendMsg);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  });
}

// ─── Kringkasting ─────────────────────────────────────────────
function initBroadcast() {
  const modal = document.getElementById('broadcastModal');
  document.getElementById('broadcastBtn').addEventListener('click', () => {
    modal.style.display = 'flex';
    document.getElementById('broadcastText').focus();
  });
  document.getElementById('cancelBroadcast').addEventListener('click', () => {
    modal.style.display = 'none';
  });
  document.getElementById('sendBroadcast').addEventListener('click', () => {
    const text = document.getElementById('broadcastText').value.trim();
    if (!text) return;
    receiveMessage({
      sender: 'Deg (Kringkast)', initials: 'AU', color: '#0078d4',
      text: `📢 KRINGKAST: ${text}`,
    });
    document.getElementById('broadcastText').value = '';
    modal.style.display = 'none';
    document.querySelector('[data-tab="chat"]').click();
  });
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
  });
}

// ─── Kartverktøylinje ─────────────────────────────────────────
function initMapToolbar() {
  let unitsVisible     = true;
  let incidentsVisible = true;
  let layerPanelVisible = false;

  document.getElementById('btnUnits').addEventListener('click', () => {
    unitsVisible = !unitsVisible;
    document.getElementById('btnUnits').classList.toggle('active', unitsVisible);
    Object.values(unitMarkers).forEach(({ marker }) => {
      if (unitsVisible) marker.addTo(map); else map.removeLayer(marker);
    });
  });

  document.getElementById('btnIncidents').addEventListener('click', () => {
    incidentsVisible = !incidentsVisible;
    document.getElementById('btnIncidents').classList.toggle('active', incidentsVisible);
    Object.values(incidentMarkers).forEach(marker => {
      if (incidentsVisible) marker.addTo(map); else map.removeLayer(marker);
    });
  });

  document.getElementById('btnLayers').addEventListener('click', e => {
    e.stopPropagation();
    layerPanelVisible = !layerPanelVisible;
    document.getElementById('layerPanel').classList.toggle('visible', layerPanelVisible);
    document.getElementById('btnLayers').classList.toggle('active', layerPanelVisible);
  });

  document.addEventListener('click', () => {
    layerPanelVisible = false;
    document.getElementById('layerPanel').classList.remove('visible');
    document.getElementById('btnLayers').classList.remove('active');
  });

  document.getElementById('layerUnits').addEventListener('change', e => {
    Object.values(unitMarkers).forEach(({ marker }) => {
      if (e.target.checked) marker.addTo(map); else map.removeLayer(marker);
    });
  });

  document.getElementById('layerIncidents').addEventListener('change', e => {
    Object.values(incidentMarkers).forEach(marker => {
      if (e.target.checked) marker.addTo(map); else map.removeLayer(marker);
    });
  });

  document.getElementById('btnMeasure').addEventListener('click', () => {
    document.getElementById('btnMeasure').classList.toggle('active');
    const isActive = document.getElementById('btnMeasure').classList.contains('active');
    map.getContainer().style.cursor = isActive ? 'crosshair' : '';
  });
}

// ─── Kartbakgrunn-veksler ─────────────────────────────────────
function initBasemapToggle() {
  const btn = document.getElementById('basemapToggleBtn');
  btn.addEventListener('click', e => {
    e.stopPropagation();
    if (currentBasemap === 'dark') {
      map.removeLayer(darkTileLayer);
      lightTileLayer.addTo(map);
      currentBasemap = 'light';
      btn.querySelector('.basemap-label').textContent = 'Mørkt kart';
      btn.classList.add('light-active');
    } else {
      map.removeLayer(lightTileLayer);
      darkTileLayer.addTo(map);
      currentBasemap = 'dark';
      btn.querySelector('.basemap-label').textContent = 'Lyst kart';
      btn.classList.remove('light-active');
    }
  });
}

// Bevegelseshastighet: grader per intervall (retningsstyrt → mål)
const UNIT_MOVE_SPEED  = 0.004;
// Tilfeldig bevegelsesavstand per intervall (patruljering)
const UNIT_RANDOM_STEP = 0.003;

// ─── Simuler enhetsforflytning (kjøres hvert 3. sekund) ───────
function simulateMovement() {
  currentUnits.filter(u => u.status !== 'offline').forEach(unit => {
    if (unit.target) {
      // Retningsstyrt bevegelse mot tildelt mål
      const dLat = unit.target.lat - unit.lat;
      const dLng = unit.target.lng - unit.lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist > 0.001) {
        unit.lat += (dLat / dist) * UNIT_MOVE_SPEED;
        unit.lng += (dLng / dist) * UNIT_MOVE_SPEED;
        unit.moving = true;
      } else {
        unit.moving = false;
        unit.target = null;
      }
    } else if (unit.moving) {
      // Tilfeldig patruljebevegelse
      unit.lat += (Math.random() - 0.5) * UNIT_RANDOM_STEP;
      unit.lng += (Math.random() - 0.5) * UNIT_RANDOM_STEP;
    }
    const data = unitMarkers[unit.id];
    if (data) {
      data.marker.setLatLng([unit.lat, unit.lng]);
      data.marker.setIcon(makeMarkerIcon(unit));
      data.marker.setPopupContent(makeUnitPopup(unit));
    }
  });
}
