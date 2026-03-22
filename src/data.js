/* ============================================================
   data.js — Static operation data
   ============================================================ */

export const LIGHT_BASEMAP_URL =
  'https://services.geodataonline.no/arcgis/rest/services/GeocacheVector/GeocacheGraatone_WM/VectorTileServer';
export const DARK_BASEMAP_URL =
  'https://services.geodataonline.no/arcgis/rest/services/GeocacheVector/GeocacheKanvasMork_WM/VectorTileServer';

// ── Basemap options ──────────────────────────────────────────
// Custom entries use the Norwegian VectorTileServer URLs above.
// ArcGIS Online entries use built-in named basemaps from ArcGIS Online.
export const BASEMAP_OPTIONS = [
  { id: 'dark',              label: 'Mørkt kart (NO)',  type: 'custom' },
  { id: 'light',             label: 'Lyst kart (NO)',   type: 'custom' },
  { id: 'dark-gray-vector',  label: 'Mørkt grå',        type: 'arcgis' },
  { id: 'gray-vector',       label: 'Lyst grå',          type: 'arcgis' },
  { id: 'streets-vector',    label: 'Gatenett',          type: 'arcgis' },
  { id: 'satellite',         label: 'Satellitt',         type: 'arcgis' },
  { id: 'hybrid',            label: 'Hybrid',            type: 'arcgis' },
  { id: 'topo-vector',       label: 'Terreng',           type: 'arcgis' },
];

// ── Skoler og barnehager layer ───────────────────────────────
// Norwegian schools and kindergartens FeatureLayer from geodataonline.no
// (Update the URL if the service path changes)
export const SKOLER_BARNEHAGER_URL =
  'https://services.geodataonline.no/arcgis/rest/services/Geocache_UTM33_EUREF89/GeocacheBarnehageSkole/FeatureServer/0';

// Portal item ID used for the ArcGIS Search / Locator widget
export const SEARCH_LOCATOR_ITEM_ID = '0727269857e14e088e3b10dd28663a89';
export const SEARCH_PORTAL_URL = 'https://beredskap.maps.arcgis.com';

// ── Nordic Shield ────────────────────────────────────────────
export const UNITS_NS = [
  { id: 'A1', name: 'Alpha-1',   role: 'Rekognosering',   status: 'online',  moving: true,  lat: 59.360, lng: 18.050 },
  { id: 'A2', name: 'Alpha-2',   role: 'Rekogn. støtte',  status: 'online',  moving: false, lat: 59.345, lng: 18.080 },
  { id: 'A3', name: 'Alpha-3',   role: 'Foroverscout',    status: 'warning', moving: true,  lat: 59.375, lng: 18.020 },
  { id: 'B1', name: 'Bravo-1',   role: 'Infanterienhet',  status: 'online',  moving: true,  lat: 59.330, lng: 17.990 },
  { id: 'B2', name: 'Bravo-2',   role: 'Infanterienhet',  status: 'online',  moving: false, lat: 59.320, lng: 18.030 },
  { id: 'B3', name: 'Bravo-3',   role: 'Støtteenhet',     status: 'online',  moving: true,  lat: 59.310, lng: 18.070 },
  { id: 'B4', name: 'Bravo-4',   role: 'Medisinsk enhet', status: 'online',  moving: false, lat: 59.300, lng: 18.100 },
  { id: 'B7', name: 'Bravo-7',   role: 'Logistikk',       status: 'warning', moving: false, lat: 59.355, lng: 18.130 },
  { id: 'C1', name: 'Charlie-1', role: 'Kommandopost',    status: 'online',  moving: false, lat: 59.338, lng: 18.065 },
  { id: 'C2', name: 'Charlie-2', role: 'HK-støtte',       status: 'online',  moving: false, lat: 59.335, lng: 18.060 },
  { id: 'D1', name: 'Delta-1',   role: 'EOD-team',        status: 'online',  moving: true,  lat: 59.380, lng: 18.090 },
  { id: 'D2', name: 'Delta-2',   role: 'EOD-støtte',      status: 'warning', moving: false, lat: 59.385, lng: 18.100 },
  { id: 'E1', name: 'Echo-1',    role: 'Flyliaison',      status: 'online',  moving: true,  lat: 59.295, lng: 17.980 },
  { id: 'E2', name: 'Echo-2',    role: 'Flystøtte',       status: 'offline', moving: false, lat: 59.290, lng: 17.970 },
];

export const INCIDENTS_NS = [
  { id: 'HEN-001', title: 'Mistenkelig kjøretøy observert', desc: 'Rutenett 59.370/18.030 — uidentifisert kjøretøykolonne', priority: 'high',   time: '10:14', icon: '🚨', lat: 59.370, lng: 18.030 },
  { id: 'HEN-002', title: 'Kommunikasjonssvikt',            desc: 'Alpha-3 mistet kontakt i 12 min — mulig jamming',        priority: 'high',   time: '10:22', icon: '📡', lat: 59.375, lng: 18.020 },
  { id: 'HEN-003', title: 'Sivil evakuering nødvendig',     desc: 'Sektor 4 — ca. 30 sivile trenger assistanse',            priority: 'medium', time: '10:31', icon: '👥', lat: 59.315, lng: 18.040 },
  { id: 'HEN-004', title: 'Mistanke om IED — Vei stengt',   desc: 'Nordlig innfartsrute blokkert — EOD utsendt',            priority: 'high',   time: '10:45', icon: '💣', lat: 59.382, lng: 18.095 },
  { id: 'HEN-005', title: 'Forsyningsrute forsinket',       desc: 'Bravo-7 melder 40 min forsinkelse pga. veiforhold',      priority: 'low',    time: '10:53', icon: '🚚', lat: 59.355, lng: 18.130 },
  { id: 'HEN-006', title: 'Medisinsk nødsituasjon',         desc: 'Én skadet ved Bravo-4 posisjon — medevak anmodet',       priority: 'medium', time: '11:02', icon: '🏥', lat: 59.300, lng: 18.100 },
];

export const CHAT_NS = [
  { id: 1,  sender: 'System',           initials: '⚙',  color: '#6b7280', system: true, self: false, time: '09:00', text: 'Operation Nordic Shield — Oppdraget startet. Alle enheter meld inn.' },
  { id: 2,  sender: 'Oberst Bergström', initials: 'CB', color: '#0078d4', self: false,  time: '09:01', text: 'Alle enheter stand-by. Alpha-lag beveger seg til angitt rutenett.' },
  { id: 3,  sender: 'Alpha-1',          initials: 'A1', color: '#0078d4', self: false,  time: '09:04', text: 'Alpha-1 i posisjon. AO klar. Starter rekognosering.' },
  { id: 4,  sender: 'Bravo-1',          initials: 'B1', color: '#2ecc71', self: false,  time: '09:08', text: 'Bravo-lag krysser sektor 3. Ingen kontakt.' },
  { id: 5,  sender: 'Deg',              initials: 'AU', color: '#0078d4', self: true,   time: '09:12', text: 'Bekreft — alle Bravo-elementer holder radiokontakt hvert 15. minutt.' },
  { id: 6,  sender: 'Bravo-1',          initials: 'B1', color: '#2ecc71', self: false,  time: '09:13', text: 'Forstått. Vil etterkomme.' },
  { id: 7,  sender: 'Delta-1',          initials: 'D1', color: '#f39c12', self: false,  time: '10:45', text: '⚠ IED mistenkt på nordlig vei. EOD-team på vei. Område avsperret.' },
  { id: 8,  sender: 'Deg',              initials: 'AU', color: '#0078d4', self: true,   time: '10:46', text: 'Alle enheter unngå nordlig innfart. Omdiriger via sektor 2. Delta-1 — bekreft ETA.' },
  { id: 9,  sender: 'Delta-1',          initials: 'D1', color: '#f39c12', self: false,  time: '10:48', text: 'ETA 12 minutter. Anmoder luftovervåking.' },
  { id: 10, sender: 'Alpha-3',          initials: 'A3', color: '#e74c3c', self: false,  time: '10:52', text: '🔴 Kontakt midlertidig tapt — samband gjenopprettet. Mulig jamming i rutenett 59.37.' },
];

// ── Norwegian Sword ──────────────────────────────────────────
export const UNITS_SWORD = [
  { id: 'P1', name: 'Patrulje-1',  role: 'Politipatrulje',  status: 'online', moving: false, lat: 59.940, lng: 10.710 },
  { id: 'P2', name: 'Patrulje-2',  role: 'Politipatrulje',  status: 'online', moving: false, lat: 59.897, lng: 10.785 },
  { id: 'P3', name: 'Patrulje-3',  role: 'Politipatrulje',  status: 'offline', moving: false, lat: 59.930, lng: 10.765 },
  { id: 'P4', name: 'Patrulje-4',  role: 'Politipatrulje',  status: 'online', moving: false, lat: 59.885, lng: 10.720 },
  { id: 'D1', name: 'Delta-1',     role: 'Beredskapstropp', status: 'online', moving: false, lat: 59.918, lng: 10.740 },
  { id: 'D2', name: 'Delta-2',     role: 'Beredskapstropp', status: 'online', moving: false, lat: 59.905, lng: 10.760 },
  { id: 'T1', name: 'Taktisk-1',   role: 'Taktisk team',    status: 'online', moving: false, lat: 59.915, lng: 10.790 },
  { id: 'T2', name: 'Taktisk-2',   role: 'Taktisk team',    status: 'online', moving: false, lat: 59.895, lng: 10.698 },
  { id: 'K1', name: 'Kommando-1',  role: 'Kommandopost',    status: 'online', moving: false, lat: 59.920, lng: 10.730 },
  { id: 'L1', name: 'Lege-1',      role: 'Medisinsk enhet', status: 'online', moving: false, lat: 59.902, lng: 10.750 },
  { id: 'U1', name: 'Utrykning-1', role: 'Utrykkingsenhet', status: 'offline', moving: false, lat: 59.935, lng: 10.750 },
  { id: 'E1', name: 'ETS-1',       role: 'Etterretning',    status: 'online', moving: false, lat: 59.910, lng: 10.708 },
];

// Incident colors (for unit markers when assigned)
export const INCIDENT_COLORS = [
  '#e74c3c', // red
  '#f39c12', // orange
  '#9b59b6', // purple
  '#1abc9c', // teal
];

// Staged incidents for Norwegian Sword (auto-allocated)
export const INCIDENTS_SWORD_STAGED = [
  {
    id: 'HEN-001', title: 'Bil i brann', icon: '🔥',
    desc: 'Grønland — bil bevisst satt i brann nær T-banestasjonen',
    priority: 'medium', lat: 59.907, lng: 10.762, delay: 15000,
    assignAll: false, colorIndex: 0,
    chatMessages: [
      { sender: 'Operasjonssentral', initials: 'OS', color: '#e74c3c',
        text: '🔥 Bil i brann meldt ved Grønland T-banestasjon. Enheter utsendt.' },
    ],
    arrivalMessages: [
      { sender: 'System', initials: '⚙', color: '#6b7280', system: true,
        text: 'Enheter ankommet brannsksted — situasjon under vurdering.' },
    ],
  },
  {
    id: 'HEN-002', title: 'Kjøretøy sperrer vei', icon: '🚛',
    desc: 'Majorstua — lastebil etterlatt og blokkerer E18 i begge retninger',
    priority: 'low', lat: 59.926, lng: 10.715, delay: 45000,
    assignAll: false, colorIndex: 1,
    chatMessages: [
      { sender: 'Operasjonssentral', initials: 'OS', color: '#f39c12',
        text: '🚛 Kjøretøy sperrer E18 ved Majorstua. Enheter disponert.' },
    ],
    arrivalMessages: [
      { sender: 'System', initials: '⚙', color: '#6b7280', system: true,
        text: 'Enheter ved Majorstua — vei delvis åpnet for trafikk.' },
    ],
  },
  {
    id: 'HEN-003', title: 'Eksplosjon rapportert', icon: '💥',
    desc: 'Bryn — improvisert sprenglegeme detonert ved bensinstasjon',
    priority: 'high', lat: 59.891, lng: 10.816, delay: 75000,
    assignAll: false, colorIndex: 2,
    chatMessages: [
      { sender: 'Operasjonssentral', initials: 'OS', color: '#9b59b6',
        text: '💥 Eksplosjon ved Bryn bensinstasjon. Beredskapstropp sendes umiddelbart!' },
      { sender: 'Delta-1', initials: 'D1', color: '#e74c3c',
        text: 'Delta rykker ut til Bryn. ETA 4 minutter. Sikrer perimeter.' },
    ],
    arrivalMessages: [
      { sender: 'Delta-1', initials: 'D1', color: '#e74c3c',
        text: 'Perimeter sikret ved Bryn. Søk etter skadde igangsatt.' },
    ],
  },
  {
    id: 'HEN-004', title: 'Person overfalt', icon: '🚨',
    desc: 'Skøyen — person angrepet av gruppe på tre menn, vitner på stedet',
    priority: 'medium', lat: 59.925, lng: 10.765, delay: 105000,
    assignAll: false, colorIndex: 3,
    chatMessages: [
      { sender: 'Operasjonssentral', initials: 'OS', color: '#1abc9c',
        text: '🚨 Overfall meldt ved Skøyen. Enheter på vei til stedet.' },
      { sender: 'Lege-1', initials: 'L1', color: '#2ecc71',
        text: 'Medisinsk enhet tar seg av skadeofferet. Tilstand vurderes.' },
    ],
    arrivalMessages: [
      { sender: 'System', initials: '⚙', color: '#6b7280', system: true,
        text: 'Overfallssted sikret. Vitner avhøres.' },
    ],
  },
  {
    id: 'HEN-005', title: 'BANKRØVERI PÅGÅR', icon: '🏦',
    desc: 'Oslo sentrum — Storgata Bank — bevæpnet ran pågår. ALLE ENHETER TIL STEDET UMIDDELBART!',
    priority: 'alarm', lat: 59.913, lng: 10.741, delay: 140000,
    assignAll: true, colorIndex: 0,
    chatMessages: [
      { sender: 'System', initials: '⚙', color: '#e74c3c', system: true,
        text: '🚨🏦 BANKRØVERI PÅGÅR — Storgata Bank — ALLE ENHETER RYK UT NÅ!' },
      { sender: 'PolitiInsp. Hansen', initials: 'KH', color: '#0078d4',
        text: 'ALLE ENHETER TIL STORGATA BANK UMIDDELBART. Bevæpnede ranere inne i banken.' },
      { sender: 'Kommando-1', initials: 'K1', color: '#f39c12',
        text: 'Kommandopost er orientert. Koordinerer med DELTA og TAKTISK. SWAT-team varslet.' },
      { sender: 'Delta-1', initials: 'D1', color: '#e74c3c',
        text: 'Delta rykker ut til Storgata. 3 minutter ETA. Avventer ordre om aksjon.' },
      { sender: 'Patrulje-1', initials: 'P1', color: '#0078d4',
        text: 'P1 sperrer nordlig utgang. Evakuerer sivile i omegn.' },
      { sender: 'Patrulje-2', initials: 'P2', color: '#0078d4',
        text: 'P2 ankommer sørfra. Gateplan sikret.' },
    ],
    arrivalMessages: [
      { sender: 'Delta-1', initials: 'D1', color: '#e74c3c',
        text: '🏦 Delta på stedet. Forhandler kontaktet. Bygget sikret utenfra.' },
      { sender: 'Taktisk-1', initials: 'T1', color: '#9b59b6',
        text: 'Taktisk team klar til inntrengning ved signal. Avventer ordre.' },
      { sender: 'PolitiInsp. Hansen', initials: 'KH', color: '#0078d4',
        text: 'God jobb alle enheter. Hold posisjon — forhandlinger pågår.' },
    ],
  },
];

export const CHAT_SWORD = [
  { id: 1, sender: 'System',             initials: '⚙',  color: '#6b7280', system: true, self: false, time: '07:30', text: 'Operasjon Norwegian Sword — Alle enheter meldt inn og klare.' },
  { id: 2, sender: 'PolitiInsp. Hansen', initials: 'KH', color: '#0078d4', self: false, time: '07:31', text: 'Alle enheter stand-by. Vi har etterretning om mulig organisert kriminalitet i Oslo-sentrum i dag.' },
  { id: 3, sender: 'Patrulje-1',         initials: 'P1', color: '#0078d4', self: false, time: '07:35', text: 'P1 i posisjon. Starter patruljering nord i AO.' },
  { id: 4, sender: 'Delta-1',            initials: 'D1', color: '#e74c3c', self: false, time: '07:40', text: 'Delta-team klart. Avventer ordre fra kommandopost.' },
  { id: 5, sender: 'Deg',                initials: 'AU', color: '#0078d4', self: true,  time: '07:45', text: 'Bekreft — alle enheter holder radiokontakt hvert 10. minutt.' },
  { id: 6, sender: 'Kommando-1',         initials: 'K1', color: '#f39c12', self: false, time: '07:46', text: 'Kommandopost er operativ. Overvåker alle sektorer.' },
];

// ── Operation config ─────────────────────────────────────────
export const OPERATION_CONFIG = {
  'nordic-shield': {
    name: 'OPERATION NORDIC SHIELD',
    center: [18.065, 59.338],
    zoom: 11,
    aoCoords: [[17.95, 59.40], [18.15, 59.40], [18.15, 59.28], [17.95, 59.28], [17.95, 59.40]],
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
      { icon: '⚠',  iconBg: 'rgba(231,76,60,0.15)',  iconColor: '#e74c3c', text: 'Alpha-3 utenfor kommunikasjonssone',  time: '2 min siden'  },
      { icon: '📶', iconBg: 'rgba(243,156,18,0.15)', iconColor: '#f39c12', text: 'Svakt signal: Bravo-7',               time: '8 min siden'  },
      { icon: '🔋', iconBg: 'rgba(241,196,15,0.15)', iconColor: '#f1c40f', text: 'Batteriadvarsel: Delta-2 (18%)',      time: '15 min siden' },
    ],
  },
  'norwegian-sword': {
    name: 'OPERASJON NORWEGIAN SWORD',
    center: [10.741, 59.913],
    zoom: 12,
    aoCoords: [[10.55, 59.97], [10.93, 59.97], [10.93, 59.84], [10.55, 59.84], [10.55, 59.97]],
    aoLabel: 'AO — Norwegian Sword',
    commander: 'Politiinspektør K. Hansen',
    aoCenter: '59.91°N 10.74°E',
    progress: 15,
    elapsed: 30 * 60000,
    units: UNITS_SWORD,
    incidents: [],
    chat: CHAT_SWORD,
    staged: true,
    stats: { units: 12, incidents: 0, tasks: 5, alerts: 3 },
    alerts: [
      { icon: '⚠',  iconBg: 'rgba(243,156,18,0.15)', iconColor: '#f39c12', text: 'Økt kriminalaktivitet rapportert i sentrum', time: '5 min siden' },
      { icon: '🔍', iconBg: 'rgba(155,89,182,0.15)', iconColor: '#9b59b6', text: 'Etterretning: Koordinerte aksjoner mulig', time: '12 min siden' },
      { icon: '🏦', iconBg: 'rgba(231,76,60,0.15)',  iconColor: '#e74c3c', text: 'Kilde varsler om mulig bankran i Oslo', time: '18 min siden' },
    ],
  },
};

export const MISSIONS_SWORD_STAGED = [
  { id: 'OPP-001', incidentId: 'HEN-001', title: 'Slukk brannen', desc: 'Brannslukking ved Grønland T-bane', status: 'active' },
  { id: 'OPP-002', incidentId: 'HEN-001', title: 'Sikre perimeter', desc: 'Etabler sikkerhetsperimeter rundt brannstedet', status: 'active' },
  { id: 'OPP-003', incidentId: 'HEN-002', title: 'Fjern kjøretøy', desc: 'Koordiner fjerning av blokkerende lastebil', status: 'active' },
  { id: 'OPP-004', incidentId: 'HEN-002', title: 'Trafikkregulering', desc: 'Etabler alternativ trafikkrute ved Majorstua', status: 'active' },
  { id: 'OPP-005', incidentId: 'HEN-003', title: 'Søk etter skadde', desc: 'Systematisk søk etter skadde ved eksplosjonsstedet', status: 'active' },
  { id: 'OPP-006', incidentId: 'HEN-003', title: 'Sikre område', desc: 'Avsperr og sikre eksplosjonsstedet ved Bryn', status: 'active' },
  { id: 'OPP-007', incidentId: 'HEN-004', title: 'Pågripelse', desc: 'Identifiser og pågrip gjerningspersonene', status: 'active' },
  { id: 'OPP-008', incidentId: 'HEN-004', title: 'Medisinsk assistanse', desc: 'Yte medisinsk hjelp til overfallsofferet', status: 'active' },
  { id: 'OPP-009', incidentId: 'HEN-005', title: 'Yte livredding', desc: 'Sikre at ingen liv går tapt under bankranet', status: 'active' },
  { id: 'OPP-010', incidentId: 'HEN-005', title: 'Sikre gissler', desc: 'Etabler kontakt med ranerne om gisslenes sikkerhet', status: 'active' },
  { id: 'OPP-011', incidentId: 'HEN-005', title: 'Omringe banken', desc: 'Plasser enheter rundt alle utganger av banken', status: 'active' },
  { id: 'OPP-012', incidentId: 'HEN-005', title: 'Forhandle med ranere', desc: 'Forhandlingsleder etablerer kontakt med ranerne', status: 'active' },
  { id: 'OPP-013', incidentId: 'HEN-005', title: 'Taktisk inntrengning', desc: 'Delta-team klargjør for taktisk inntrengning ved signal', status: 'active' },
];

export const SYMBOLS = [
  { id: 'sym-001', name: 'Infanteri',       icon: '🪖', category: 'Militær',    color: '#2ecc71', bgColor: 'rgba(46,204,113,0.15)',  description: 'Infanterienhet — grunnleggende kamptropp' },
  { id: 'sym-002', name: 'Kommandopost',    icon: '📡', category: 'Militær',    color: '#0078d4', bgColor: 'rgba(0,120,212,0.15)',   description: 'Kommandopost / HK' },
  { id: 'sym-003', name: 'Medisinsk',       icon: '🏥', category: 'Medisinsk',  color: '#e74c3c', bgColor: 'rgba(231,76,60,0.15)',   description: 'Medisinsk enhet / sanitetsavdeling' },
  { id: 'sym-004', name: 'EOD',             icon: '💣', category: 'Militær',    color: '#f39c12', bgColor: 'rgba(243,156,18,0.15)',  description: 'Eksplosivminering og destruksjon' },
  { id: 'sym-005', name: 'Logistikk',       icon: '🚚', category: 'Støtte',     color: '#9b59b6', bgColor: 'rgba(155,89,182,0.15)', description: 'Logistikk og forsyning' },
  { id: 'sym-006', name: 'Rekognosering',   icon: '🔭', category: 'Militær',    color: '#1abc9c', bgColor: 'rgba(26,188,156,0.15)',  description: 'Rekognoseringsenhet' },
  { id: 'sym-007', name: 'Patrulje',        icon: '🚓', category: 'Politi',     color: '#0078d4', bgColor: 'rgba(0,120,212,0.15)',   description: 'Politipatrulje' },
  { id: 'sym-008', name: 'Beredskapstropp', icon: '🦅', category: 'Politi',     color: '#e74c3c', bgColor: 'rgba(231,76,60,0.15)',   description: 'Delta / beredskapstropp' },
  { id: 'sym-009', name: 'Taktisk team',    icon: '🎯', category: 'Politi',     color: '#9b59b6', bgColor: 'rgba(155,89,182,0.15)', description: 'Taktisk politienhet' },
  { id: 'sym-010', name: 'Brann',           icon: '🔥', category: 'Hendelse',   color: '#e74c3c', bgColor: 'rgba(231,76,60,0.15)',   description: 'Brann eller eksplosjonsfare' },
  { id: 'sym-011', name: 'Eksplosjon',      icon: '💥', category: 'Hendelse',   color: '#f39c12', bgColor: 'rgba(243,156,18,0.15)',  description: 'Eksplosjon rapportert' },
  { id: 'sym-012', name: 'Alarm',           icon: '🚨', category: 'Hendelse',   color: '#e74c3c', bgColor: 'rgba(231,76,60,0.15)',   description: 'Nødalarm / kritisk hendelse' },
  { id: 'sym-013', name: 'Sivil evak.',     icon: '👥', category: 'Hendelse',   color: '#f39c12', bgColor: 'rgba(243,156,18,0.15)',  description: 'Sivil evakuering nødvendig' },
  { id: 'sym-014', name: 'AO grense',       icon: '🗺️', category: 'Kart',       color: '#0078d4', bgColor: 'rgba(0,120,212,0.15)',   description: 'Operasjonsområde (AO) grense' },
  { id: 'sym-015', name: 'Etterretning',    icon: '🔍', category: 'Info',       color: '#9b59b6', bgColor: 'rgba(155,89,182,0.15)', description: 'Etterretningsinformasjon' },
  { id: 'sym-016', name: 'Luftstøtte',      icon: '🚁', category: 'Militær',    color: '#1abc9c', bgColor: 'rgba(26,188,156,0.15)',  description: 'Helikopter / luftstøtte' },
  { id: 'sym-017', name: 'Utrykning',       icon: '🚑', category: 'Medisinsk',  color: '#e74c3c', bgColor: 'rgba(231,76,60,0.15)',   description: 'Ambulanse / utrykningstjeneste' },
  { id: 'sym-018', name: 'Vegblokade',      icon: '🚛', category: 'Hendelse',   color: '#f39c12', bgColor: 'rgba(243,156,18,0.15)',  description: 'Kjøretøy blokkerer vei' },
];
