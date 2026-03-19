/* ============================================================
   Operation Dashboard — app.js
   ============================================================ */

'use strict';

// ─── Data ─────────────────────────────────────────────────────
const UNITS = [
  { id: 'A1', name: 'Alpha-1', role: 'Reconnaissance', status: 'online',  moving: true,  lat: 59.360, lng: 18.050, color: '#0078d4', signal: 4 },
  { id: 'A2', name: 'Alpha-2', role: 'Recon Support',  status: 'online',  moving: false, lat: 59.345, lng: 18.080, color: '#0078d4', signal: 3 },
  { id: 'A3', name: 'Alpha-3', role: 'Forward Scout',  status: 'warning', moving: true,  lat: 59.375, lng: 18.020, color: '#e74c3c', signal: 1 },
  { id: 'B1', name: 'Bravo-1', role: 'Infantry Squad', status: 'online',  moving: true,  lat: 59.330, lng: 17.990, color: '#2ecc71', signal: 4 },
  { id: 'B2', name: 'Bravo-2', role: 'Infantry Squad', status: 'online',  moving: false, lat: 59.320, lng: 18.030, color: '#2ecc71', signal: 4 },
  { id: 'B3', name: 'Bravo-3', role: 'Support',        status: 'online',  moving: true,  lat: 59.310, lng: 18.070, color: '#2ecc71', signal: 3 },
  { id: 'B4', name: 'Bravo-4', role: 'Medic Unit',     status: 'online',  moving: false, lat: 59.300, lng: 18.100, color: '#2ecc71', signal: 4 },
  { id: 'B7', name: 'Bravo-7', role: 'Logistics',      status: 'warning', moving: false, lat: 59.355, lng: 18.130, color: '#f39c12', signal: 2 },
  { id: 'C1', name: 'Charlie-1', role: 'Command Post', status: 'online',  moving: false, lat: 59.338, lng: 18.065, color: '#9b59b6', signal: 4 },
  { id: 'C2', name: 'Charlie-2', role: 'HQ Support',   status: 'online',  moving: false, lat: 59.335, lng: 18.060, color: '#9b59b6', signal: 4 },
  { id: 'D1', name: 'Delta-1',   role: 'EOD Team',     status: 'online',  moving: true,  lat: 59.380, lng: 18.090, color: '#f39c12', signal: 3 },
  { id: 'D2', name: 'Delta-2',   role: 'EOD Support',  status: 'warning', moving: false, lat: 59.385, lng: 18.100, color: '#e74c3c', signal: 3 },
  { id: 'E1', name: 'Echo-1',    role: 'Air Liaison',  status: 'online',  moving: true,  lat: 59.295, lng: 17.980, color: '#1abc9c', signal: 4 },
  { id: 'E2', name: 'Echo-2',    role: 'Air Support',  status: 'offline', moving: false, lat: 59.290, lng: 17.970, color: '#6b7280', signal: 0 },
];

const INCIDENTS = [
  { id: 'INC-001', title: 'Suspicious Vehicle Sighted', desc: 'Grid 59.370 / 18.030 — unidentified vehicle convoy', priority: 'high',   time: '10:14',  icon: '🚨', lat: 59.370, lng: 18.030 },
  { id: 'INC-002', title: 'Communications Blackout',    desc: 'Alpha-3 lost contact for 12 min — possible jamming',   priority: 'high',   time: '10:22',  icon: '📡', lat: 59.375, lng: 18.020 },
  { id: 'INC-003', title: 'Civilian Evacuation Needed', desc: 'Sector 4 — approx. 30 civilians require assistance',   priority: 'medium', time: '10:31',  icon: '👥', lat: 59.315, lng: 18.040 },
  { id: 'INC-004', title: 'IED Suspected — Road Closed',desc: 'Northern approach route blocked — EOD dispatched',     priority: 'high',   time: '10:45',  icon: '💣', lat: 59.382, lng: 18.095 },
  { id: 'INC-005', title: 'Supply Route Delay',         desc: 'Bravo-7 reports 40 min delay due to road condition',   priority: 'low',    time: '10:53',  icon: '🚚', lat: 59.355, lng: 18.130 },
  { id: 'INC-006', title: 'Medical Emergency',          desc: 'One casualty at Bravo-4 position — medevac requested', priority: 'medium', time: '11:02',  icon: '🏥', lat: 59.300, lng: 18.100 },
];

const CHAT_HISTORY = [
  { id: 1, sender: 'System',    initials: '⚙',  color: '#6b7280', self: false, system: true,  time: '09:00', text: 'Operation Nordic Shield — Mission started. All units report in.' },
  { id: 2, sender: 'Col. Bergström', initials: 'CB', color: '#0078d4', self: false, time: '09:01', text: 'All units stand by. Alpha teams move to designated grid reference.' },
  { id: 3, sender: 'Alpha-1',  initials: 'A1', color: '#0078d4', self: false, time: '09:04', text: 'Alpha-1 in position. AO clear. Beginning reconnaissance sweep.' },
  { id: 4, sender: 'Bravo-1',  initials: 'B1', color: '#2ecc71', self: false, time: '09:08', text: 'Bravo team crossing sector 3. No contact.' },
  { id: 5, sender: 'You',      initials: 'AU', color: '#0078d4', self: true,  time: '09:12', text: 'Confirm — all Bravo elements maintain radio check every 15 minutes.' },
  { id: 6, sender: 'Bravo-1',  initials: 'B1', color: '#2ecc71', self: false, time: '09:13', text: 'Copy that. Will comply.' },
  { id: 7, sender: 'Delta-1',  initials: 'D1', color: '#f39c12', self: false, time: '10:45', text: '⚠ IED suspected on northern road. EOD team on route. Area cordoned.' },
  { id: 8, sender: 'You',      initials: 'AU', color: '#0078d4', self: true,  time: '10:46', text: 'All units avoid northern approach. Reroute via sector 2. Delta-1 — confirm your ETA.' },
  { id: 9, sender: 'Delta-1',  initials: 'D1', color: '#f39c12', self: false, time: '10:48', text: 'ETA 12 minutes. Requesting air surveillance support.' },
  { id: 10, sender: 'Alpha-3', initials: 'A3', color: '#e74c3c', self: false, time: '10:52', text: '🔴 Contact lost briefly — comms restored. Possible jamming in grid 59.37.' },
];

// ─── State ────────────────────────────────────────────────────
let map;
const unitMarkers    = {};
const incidentMarkers = {};
let unreadChat = 2;
let unreadIncidents = 4;
let missionStartTime;
let filterUnit = 'all';
let filterIncident = 'all';

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initMap();
  renderParticipants();
  renderIncidents();
  renderChat();
  initTabs();
  initSearch();
  initFilterPills();
  initChatInput();
  initBroadcast();
  initMapToolbar();
  missionStartTime = Date.now() - (2 * 3600000 + 12 * 60000); // started 2h 12m ago
  updateMissionDuration();
  setInterval(updateMissionDuration, 10000);

  // Periodically simulate unit movement
  setInterval(simulateMovement, 5000);
  // Periodic chat message
  setTimeout(() => receiveMessage({
    sender: 'Charlie-1', initials: 'C1', color: '#9b59b6',
    text: 'CP reports all sectors green. Awaiting next briefing.',
  }), 12000);
});

// ─── Clock ────────────────────────────────────────────────────
function initClock() {
  function tick() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    document.getElementById('clock').textContent =
      `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} UTC`;
    document.getElementById('clockDate').textContent =
      now.toLocaleDateString('en-GB', { day:'2-digit', month:'short' });
    document.getElementById('missionStart').textContent =
      `${pad(now.getHours()-2<0?now.getHours()-2+24:now.getHours()-2)}:${pad(now.getMinutes())} UTC`;
  }
  tick();
  setInterval(tick, 1000);
}

function updateMissionDuration() {
  const elapsed = Date.now() - missionStartTime;
  const h = Math.floor(elapsed / 3600000);
  const m = Math.floor((elapsed % 3600000) / 60000);
  document.getElementById('missionDuration').textContent = `${h}h ${m}m`;
}

// ─── Map ──────────────────────────────────────────────────────
function initMap() {
  map = L.map('map', {
    center: [59.338, 18.065],
    zoom: 11,
    zoomControl: true,
  });

  // Dark tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CartoDB',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  // Area of Operations polygon
  const aoCoords = [
    [59.40, 17.95], [59.40, 18.15], [59.28, 18.15], [59.28, 17.95],
  ];
  L.polygon(aoCoords, {
    color: '#0078d4',
    weight: 1.5,
    opacity: 0.6,
    fillColor: '#0078d4',
    fillOpacity: 0.05,
    dashArray: '5 5',
  }).addTo(map).bindTooltip('AO — Nordic Shield', { permanent: false, className: '' });

  // Add unit markers
  UNITS.forEach(addUnitMarker);

  // Add incident markers
  INCIDENTS.forEach(addIncidentMarker);

  // Mouse move coords
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

function makeMarkerIcon(unit) {
  const statusColor = unit.status === 'online' ? '#2ecc71'
    : unit.status === 'warning' ? '#f39c12' : '#6b7280';
  const html = `
    <div style="
      width:34px; height:34px; border-radius:50%;
      background:${unit.color}; border:2.5px solid ${statusColor};
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:10px; font-weight:700;
      box-shadow:0 2px 8px rgba(0,0,0,0.55);
      cursor:pointer;
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
  const statusText = unit.status === 'online' ? 'Online' : unit.status === 'warning' ? 'Warning' : 'Offline';
  const statusColor = unit.status === 'online' ? '#2ecc71' : unit.status === 'warning' ? '#f39c12' : '#6b7280';
  return `
    <div class="popup-content">
      <div class="popup-header">
        <div style="width:28px;height:28px;border-radius:50%;background:${unit.color};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;">${unit.id}</div>
        <div>
          <div class="popup-title">${unit.name}</div>
          <div style="font-size:10px;color:var(--text-muted)">${unit.role}</div>
        </div>
      </div>
      <div class="popup-row"><span class="label">Status</span><span class="value" style="color:${statusColor}">${statusText}</span></div>
      <div class="popup-row"><span class="label">Position</span><span class="value">${unit.lat.toFixed(3)}°N ${unit.lng.toFixed(3)}°E</span></div>
      <div class="popup-row"><span class="label">Moving</span><span class="value">${unit.moving ? 'Yes' : 'Stationary'}</span></div>
    </div>`;
}

function addIncidentMarker(inc) {
  const priorityColor = inc.priority === 'high' ? '#e74c3c'
    : inc.priority === 'medium' ? '#f39c12' : '#2ecc71';
  const html = `
    <div style="
      width:28px; height:28px; border-radius:6px;
      background:${priorityColor}22; border:2px solid ${priorityColor};
      display:flex; align-items:center; justify-content:center;
      font-size:13px; cursor:pointer;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
    ">${inc.icon}</div>`;
  const icon = L.divIcon({ html, className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
  const marker = L.marker([inc.lat, inc.lng], { icon })
    .addTo(map)
    .bindPopup(`
      <div class="popup-content">
        <div class="popup-header">
          <span style="font-size:18px">${inc.icon}</span>
          <div><div class="popup-title">${inc.title}</div>
          <div style="font-size:10px;color:var(--text-muted)">${inc.id} · ${inc.time}</div></div>
        </div>
        <div class="popup-row"><span class="label">Priority</span><span class="value" style="color:${priorityColor}">${inc.priority.toUpperCase()}</span></div>
        <div style="font-size:11px;color:var(--text-secondary);margin-top:4px">${inc.desc}</div>
      </div>`, { maxWidth: 240 });
  incidentMarkers[inc.id] = marker;
}

// ─── Participants ─────────────────────────────────────────────
function renderParticipants(query = '', filter = 'all') {
  const container = document.getElementById('participantList');
  container.innerHTML = '';

  const filtered = UNITS.filter(u => {
    const matchQ = !query || u.name.toLowerCase().includes(query.toLowerCase())
      || u.role.toLowerCase().includes(query.toLowerCase())
      || u.id.toLowerCase().includes(query.toLowerCase());
    const matchF = filter === 'all'
      || (filter === 'online' && u.status === 'online')
      || (filter === 'moving' && u.moving)
      || (filter === 'offline' && u.status === 'offline');
    return matchQ && matchF;
  });

  // Group by status
  const groups = { online: [], warning: [], offline: [] };
  filtered.forEach(u => groups[u.status]?.push(u) || groups.online.push(u));

  const groupLabels = { online: 'Online', warning: 'Warning / Low Signal', offline: 'Offline' };
  let total = 0;

  Object.entries(groups).forEach(([status, units]) => {
    if (!units.length) return;
    const header = document.createElement('div');
    header.className = 'group-header';
    const dot = status === 'online' ? '●' : status === 'warning' ? '▲' : '○';
    const color = status === 'online' ? '#2ecc71' : status === 'warning' ? '#f39c12' : '#6b7280';
    header.innerHTML = `<span style="color:${color}">${dot} ${groupLabels[status]}</span><span>${units.length}</span>`;
    container.appendChild(header);

    units.forEach(u => {
      total++;
      container.appendChild(buildParticipantItem(u));
    });
  });

  if (!filtered.length) {
    container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-muted); font-size:12px;">No units found</div>';
  }

  document.getElementById('participantCount').textContent = `${total} ${filter === 'all' ? 'units' : filter}`;
}

function buildParticipantItem(unit) {
  const el = document.createElement('div');
  el.className = 'participant-item';
  el.dataset.id = unit.id;

  const statusColor = unit.status === 'online' ? '#2ecc71'
    : unit.status === 'warning' ? '#f39c12' : '#6b7280';

  // Signal bars
  let signalBars = '';
  for (let i = 1; i <= 4; i++) {
    const h = 4 + (i * 3);
    const active = i <= unit.signal ? ' active' : '';
    signalBars += `<div class="signal-bar${active}" style="height:${h}px;"></div>`;
  }

  el.innerHTML = `
    <div class="participant-avatar" style="background:${unit.color}">
      ${unit.id}
      <div class="participant-status-dot" style="background:${statusColor}"></div>
    </div>
    <div class="participant-info">
      <div class="participant-name">${unit.name}</div>
      <div class="participant-role">${unit.role}${unit.moving ? ' · Moving' : ''}</div>
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

// ─── Incidents ────────────────────────────────────────────────
function renderIncidents(query = '', filter = 'all') {
  const container = document.getElementById('incidentList');
  container.innerHTML = '';

  const filtered = INCIDENTS.filter(inc => {
    const matchQ = !query
      || inc.title.toLowerCase().includes(query.toLowerCase())
      || inc.id.toLowerCase().includes(query.toLowerCase());
    const matchF = filter === 'all' || inc.priority === filter;
    return matchQ && matchF;
  });

  if (!filtered.length) {
    container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-muted); font-size:12px;">No incidents found</div>';
    return;
  }

  filtered.forEach(inc => {
    const el = document.createElement('div');
    el.className = 'incident-item';
    const priorityColor = inc.priority === 'high' ? 'var(--accent-red)'
      : inc.priority === 'medium' ? 'var(--accent-orange)' : 'var(--accent-green)';
    el.innerHTML = `
      <div class="incident-icon" style="background:${priorityColor}1a; border:1px solid ${priorityColor}44">${inc.icon}</div>
      <div class="incident-info">
        <div class="incident-title">${inc.title}</div>
        <div class="incident-desc">${inc.desc}</div>
      </div>
      <div class="incident-meta">
        <div class="incident-time">${inc.time}</div>
        <div class="priority-badge priority-${inc.priority}">${inc.priority}</div>
      </div>`;
    el.addEventListener('click', () => {
      map.setView([inc.lat, inc.lng], 14, { animate: true });
      if (incidentMarkers[inc.id]) incidentMarkers[inc.id].openPopup();
      // Switch to map view
    });
    container.appendChild(el);
  });

  document.getElementById('incidentCount').textContent = `${filtered.length} open`;
}

// ─── Chat ─────────────────────────────────────────────────────
function renderChat() {
  const container = document.getElementById('chatMessages');
  container.innerHTML = '';

  let lastDate = null;
  CHAT_HISTORY.forEach(msg => {
    const msgDate = 'Today';
    if (msgDate !== lastDate) {
      const div = document.createElement('div');
      div.className = 'chat-date-divider';
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
    el.innerHTML = `
      <div class="chat-msg-bubble system" style="width:100%; text-align:center;">${msg.text}</div>`;
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

  // Increment badge if chat not active
  if (!document.getElementById('tab-chat').classList.contains('active')) {
    unreadChat++;
    document.getElementById('chatBadge').textContent = unreadChat;
    document.getElementById('chatBadge').style.display = '';
  }
}

// ─── Tabs ─────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tabId}`).classList.add('active');

      // Clear badges
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

// ─── Search ───────────────────────────────────────────────────
function initSearch() {
  document.getElementById('participantSearch').addEventListener('input', e => {
    renderParticipants(e.target.value, filterUnit);
  });
  document.getElementById('incidentSearch').addEventListener('input', e => {
    renderIncidents(e.target.value, filterIncident);
  });
}

// ─── Filter Pills ─────────────────────────────────────────────
function initFilterPills() {
  document.querySelectorAll('#tab-participants .filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#tab-participants .filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      filterUnit = pill.dataset.filter;
      renderParticipants(document.getElementById('participantSearch').value, filterUnit);
    });
  });

  document.querySelectorAll('#tab-incidents .filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#tab-incidents .filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      filterIncident = pill.dataset.filter;
      renderIncidents(document.getElementById('incidentSearch').value, filterIncident);
    });
  });
}

// ─── Chat Input ───────────────────────────────────────────────
function initChatInput() {
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');

  function sendMsg() {
    const text = input.value.trim();
    if (!text) return;
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const msg = { sender: 'You', initials: 'AU', color: '#0078d4', self: true, time, text };
    CHAT_HISTORY.push(msg);
    const container = document.getElementById('chatMessages');
    container.appendChild(buildChatMessage(msg));
    container.scrollTop = container.scrollHeight;
    input.value = '';
    input.style.height = 'auto';
  }

  sendBtn.addEventListener('click', sendMsg);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMsg();
    }
  });

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  });
}

// ─── Broadcast ────────────────────────────────────────────────
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
      sender: 'You (Broadcast)',
      initials: 'AU',
      color: '#0078d4',
      text: `📢 BROADCAST: ${text}`,
    });
    document.getElementById('broadcastText').value = '';
    modal.style.display = 'none';
    // Switch to chat tab to show the message
    document.querySelector('[data-tab="chat"]').click();
  });
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
  });
}

// ─── Map Toolbar ──────────────────────────────────────────────
function initMapToolbar() {
  let unitsVisible = true;
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

  // Measure button — simple toggle placeholder
  document.getElementById('btnMeasure').addEventListener('click', () => {
    document.getElementById('btnMeasure').classList.toggle('active');
    const isActive = document.getElementById('btnMeasure').classList.contains('active');
    map.getContainer().style.cursor = isActive ? 'crosshair' : '';
  });
}

// ─── Simulate Unit Movement ───────────────────────────────────
function simulateMovement() {
  UNITS.filter(u => u.moving && u.status !== 'offline').forEach(unit => {
    unit.lat += (Math.random() - 0.5) * 0.002;
    unit.lng += (Math.random() - 0.5) * 0.002;

    const data = unitMarkers[unit.id];
    if (data) {
      data.marker.setLatLng([unit.lat, unit.lng]);
      data.marker.setIcon(makeMarkerIcon(unit));
      data.marker.setPopupContent(makeUnitPopup(unit));
    }
  });
}
