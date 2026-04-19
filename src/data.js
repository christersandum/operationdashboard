/* ============================================================
   data.js — Static configuration and shared constants
   ============================================================ */

// ── Incident colors (used for unit markers when assigned) ────
export const INCIDENT_COLORS = [
  '#e74c3c', // red
  '#f39c12', // orange
  '#9b59b6', // purple
  '#1abc9c', // teal
];

// ── Symbol library (UI-only, no ArcGIS dependency) ───────────
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
