/* ============================================================
   seedData.js — Norwegian Sword seed data
   Used for first-login migration and as offline fallback.
   ============================================================ */

export const OPERATION_ID   = 'norwegian-sword';
export const OPERATION_NAME = 'OPERASJON NORWEGIAN SWORD';

export const SEED_CONFIG = {
  operationId:   OPERATION_ID,
  operationName: OPERATION_NAME,
  center:        [10.741, 59.913],
  zoom:          12,
  aoCoords:      [[10.55, 59.97], [10.93, 59.97], [10.93, 59.84], [10.55, 59.84], [10.55, 59.97]],
  aoLabel:       'AO — Norwegian Sword',
  commander:     'Politiinspektør K. Hansen',
  aoCenter:      '59.91°N 10.74°E',
  progress:      15,
  elapsed:       30 * 60000,
  staged:        true,
  stats:         { units: 12, incidents: 0, tasks: 5, alerts: 3 },
  alerts: [
    { icon: '⚠',  iconBg: 'rgba(243,156,18,0.15)', iconColor: '#f39c12', text: 'Økt kriminalaktivitet rapportert i sentrum', time: '5 min siden' },
    { icon: '🔍', iconBg: 'rgba(155,89,182,0.15)', iconColor: '#9b59b6', text: 'Etterretning: Koordinerte aksjoner mulig',    time: '12 min siden' },
    { icon: '🏦', iconBg: 'rgba(231,76,60,0.15)',  iconColor: '#e74c3c', text: 'Kilde varsler om mulig bankran i Oslo',       time: '18 min siden' },
  ],
};

export const UNITS_SWORD = [
  { id: 'P1', name: 'Patrulje-1',  role: 'Politipatrulje',  status: 'online',  moving: false, lat: 59.940, lng: 10.710 },
  { id: 'P2', name: 'Patrulje-2',  role: 'Politipatrulje',  status: 'online',  moving: false, lat: 59.897, lng: 10.785 },
  { id: 'P3', name: 'Patrulje-3',  role: 'Politipatrulje',  status: 'offline', moving: false, lat: 59.930, lng: 10.765 },
  { id: 'P4', name: 'Patrulje-4',  role: 'Politipatrulje',  status: 'online',  moving: false, lat: 59.885, lng: 10.720 },
  { id: 'D1', name: 'Delta-1',     role: 'Beredskapstropp', status: 'online',  moving: false, lat: 59.918, lng: 10.740 },
  { id: 'D2', name: 'Delta-2',     role: 'Beredskapstropp', status: 'online',  moving: false, lat: 59.905, lng: 10.760 },
  { id: 'T1', name: 'Taktisk-1',   role: 'Taktisk team',    status: 'online',  moving: false, lat: 59.915, lng: 10.790 },
  { id: 'T2', name: 'Taktisk-2',   role: 'Taktisk team',    status: 'online',  moving: false, lat: 59.895, lng: 10.698 },
  { id: 'K1', name: 'Kommando-1',  role: 'Kommandopost',    status: 'online',  moving: false, lat: 59.920, lng: 10.730 },
  { id: 'L1', name: 'Lege-1',      role: 'Medisinsk enhet', status: 'online',  moving: false, lat: 59.902, lng: 10.750 },
  { id: 'U1', name: 'Utrykning-1', role: 'Utrykkingsenhet', status: 'offline', moving: false, lat: 59.935, lng: 10.750 },
  { id: 'E1', name: 'ETS-1',       role: 'Etterretning',    status: 'online',  moving: false, lat: 59.910, lng: 10.708 },
];

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

export const MISSIONS_SWORD_STAGED = [
  { id: 'OPP-001', incidentId: 'HEN-001', title: 'Slukk brannen',           desc: 'Brannslukking ved Grønland T-bane',                              status: 'active' },
  { id: 'OPP-002', incidentId: 'HEN-001', title: 'Sikre perimeter',          desc: 'Etabler sikkerhetsperimeter rundt brannstedet',                   status: 'active' },
  { id: 'OPP-003', incidentId: 'HEN-002', title: 'Fjern kjøretøy',           desc: 'Koordiner fjerning av blokkerende lastebil',                      status: 'active' },
  { id: 'OPP-004', incidentId: 'HEN-002', title: 'Trafikkregulering',        desc: 'Etabler alternativ trafikkrute ved Majorstua',                    status: 'active' },
  { id: 'OPP-005', incidentId: 'HEN-003', title: 'Søk etter skadde',         desc: 'Systematisk søk etter skadde ved eksplosjonsstedet',              status: 'active' },
  { id: 'OPP-006', incidentId: 'HEN-003', title: 'Sikre område',             desc: 'Avsperr og sikre eksplosjonsstedet ved Bryn',                     status: 'active' },
  { id: 'OPP-007', incidentId: 'HEN-004', title: 'Pågripelse',               desc: 'Identifiser og pågrip gjerningspersonene',                       status: 'active' },
  { id: 'OPP-008', incidentId: 'HEN-004', title: 'Medisinsk assistanse',     desc: 'Yte medisinsk hjelp til overfallsofferet',                        status: 'active' },
  { id: 'OPP-009', incidentId: 'HEN-005', title: 'Yte livredding',           desc: 'Sikre at ingen liv går tapt under bankranet',                     status: 'active' },
  { id: 'OPP-010', incidentId: 'HEN-005', title: 'Sikre gissler',            desc: 'Etabler kontakt med ranerne om gisslenes sikkerhet',              status: 'active' },
  { id: 'OPP-011', incidentId: 'HEN-005', title: 'Omringe banken',           desc: 'Plasser enheter rundt alle utganger av banken',                   status: 'active' },
  { id: 'OPP-012', incidentId: 'HEN-005', title: 'Forhandle med ranere',     desc: 'Forhandlingsleder etablerer kontakt med ranerne',                 status: 'active' },
  { id: 'OPP-013', incidentId: 'HEN-005', title: 'Taktisk inntrengning',     desc: 'Delta-team klargjør for taktisk inntrengning ved signal',         status: 'active' },
];

export const CHAT_SWORD = [
  { id: 1, sender: 'System',             initials: '⚙',  color: '#6b7280', system: true, self: false, time: '07:30', text: 'Operasjon Norwegian Sword — Alle enheter meldt inn og klare.' },
  { id: 2, sender: 'PolitiInsp. Hansen', initials: 'KH', color: '#0078d4', self: false,  time: '07:31', text: 'Alle enheter stand-by. Vi har etterretning om mulig organisert kriminalitet i Oslo-sentrum i dag.' },
  { id: 3, sender: 'Patrulje-1',         initials: 'P1', color: '#0078d4', self: false,  time: '07:35', text: 'P1 i posisjon. Starter patruljering nord i AO.' },
  { id: 4, sender: 'Delta-1',            initials: 'D1', color: '#e74c3c', self: false,  time: '07:40', text: 'Delta-team klart. Avventer ordre fra kommandopost.' },
  { id: 5, sender: 'Deg',                initials: 'AU', color: '#0078d4', self: true,   time: '07:45', text: 'Bekreft — alle enheter holder radiokontakt hvert 10. minutt.' },
  { id: 6, sender: 'Kommando-1',         initials: 'K1', color: '#f39c12', self: false,  time: '07:46', text: 'Kommandopost er operativ. Overvåker alle sektorer.' },
];

export const ALERTS_SWORD = [
  {
    alert_id: 'ALT-001', text: 'Økt kriminalaktivitet rapportert i sentrum',
    icon: '⚠', icon_bg: 'rgba(243,156,18,0.15)', icon_color: '#f39c12',
    severity: 'warning',
  },
  {
    alert_id: 'ALT-002', text: 'Etterretning: Koordinerte aksjoner mulig',
    icon: '🔍', icon_bg: 'rgba(155,89,182,0.15)', icon_color: '#9b59b6',
    severity: 'info',
  },
  {
    alert_id: 'ALT-003', text: 'Kilde varsler om mulig bankran i Oslo',
    icon: '🏦', icon_bg: 'rgba(231,76,60,0.15)', icon_color: '#e74c3c',
    severity: 'critical',
  },
];
