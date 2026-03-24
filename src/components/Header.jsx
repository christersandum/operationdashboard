import React, { useState, useEffect, useRef } from 'react';

const TIMEZONES = [
  { id: 'UTC',                label: 'UTC',       abbr: 'UTC'  },
  { id: 'Europe/Oslo',        label: 'Oslo',      abbr: 'CET/CEST' },
  { id: 'America/New_York',   label: 'New York',  abbr: 'ET'   },
  { id: 'America/Los_Angeles',label: 'Los Angeles',abbr: 'PT'  },
  { id: 'Asia/Tokyo',         label: 'Tokyo',     abbr: 'JST'  },
];

export default function Header({
  currentOpId,
  onOperationChange,
  onBroadcast,
  scenarioEnded,
  onSaveOperation,
  onLoadOperation,
  onNewOperation,
  onDeleteOperation,
  onDrawAO,
  drawAOMode,
  onSettingsChange,
  timingConfig,
}) {
  const pad = n => String(n).padStart(2, '0');
  const [time, setTime]   = useState('--:--:--');
  const [date, setDate]   = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [tzDropdownOpen, setTzDropdownOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filMenuOpen, setFilMenuOpen] = useState(false);
  const filMenuRef = useRef(null);

  // Settings state
  const defaultSettings = {
    firstDelay: 15,
    interval: 30,
    travelTime: 35,
    bankChatDuration: 30,
    alertInterval: 10,
  };
  const [settings, setSettings] = useState({ ...defaultSettings, ...(timingConfig || {}) });

  const tzRef = useRef(null);
  const adminRef = useRef(null);
  const settingsRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      try {
        const fmt = new Intl.DateTimeFormat('nb-NO', {
          timeZone: timezone,
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false,
        });
        const parts = fmt.formatToParts(now);
        const h = parts.find(p => p.type === 'hour')?.value || '00';
        const m = parts.find(p => p.type === 'minute')?.value || '00';
        const s = parts.find(p => p.type === 'second')?.value || '00';
        const tz = TIMEZONES.find(t => t.id === timezone);
        setTime(`${h}:${m}:${s} ${tz?.abbr || timezone}`);

        const dateFmt = new Intl.DateTimeFormat('nb-NO', {
          timeZone: timezone, day: '2-digit', month: 'short',
        });
        setDate(dateFmt.format(now));
      } catch {
        const h = pad(now.getHours());
        const m = pad(now.getMinutes());
        const s = pad(now.getSeconds());
        setTime(`${h}:${m}:${s} UTC`);
        setDate(now.toLocaleDateString('nb-NO', { day: '2-digit', month: 'short' }));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timezone]);

  // Close popups on outside click
  useEffect(() => {
    const handler = (e) => {
      if (tzRef.current && !tzRef.current.contains(e.target)) setTzDropdownOpen(false);
      if (adminRef.current && !adminRef.current.contains(e.target)) setAdminOpen(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
      if (filMenuRef.current && !filMenuRef.current.contains(e.target)) setFilMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const applySettings = () => {
    if (onSettingsChange) onSettingsChange(settings);
    setSettingsOpen(false);
  };

  return (
    <header className="top-header">
      {/* Logo */}
      <div className="header-logo">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <polygon points="11,1 20,6.5 20,15.5 11,21 2,15.5 2,6.5" fill="#0078d4" opacity="0.85"/>
          <polygon points="11,4 17.5,7.75 17.5,15.25 11,19 4.5,15.25 4.5,7.75" fill="none" stroke="#fff" strokeWidth="1.2"/>
          <circle cx="11" cy="11" r="3" fill="#fff"/>
        </svg>
        OPERASJONS DASHBOARD
      </div>

      {/* Operation selector */}
      <div className="operation-select-wrap">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        <select className="operation-select" value={currentOpId} onChange={e => onOperationChange(e.target.value)}>
          <option value="nordic-shield">Operation Nordic Shield</option>
          <option value="norwegian-sword">Operasjon Norwegian Sword</option>
        </select>
      </div>

      {/* Active/Ferdig status */}
      <div className="header-status-badge" style={scenarioEnded ? {
        color: '#e74c3c',
        borderColor: 'rgba(231,76,60,0.3)',
        background: 'rgba(231,76,60,0.1)',
      } : {}}>
        <div className="status-dot" style={scenarioEnded ? { background: '#e74c3c', animation: 'none' } : {}} />
        <span>{scenarioEnded ? 'FERDIG' : 'AKTIV'}</span>
      </div>

      <div className="header-spacer" />

      {/* Clock with timezone dropdown */}
      <div className="tz-clock-wrap" ref={tzRef}>
        <button
          className="header-btn"
          style={{ minWidth: '130px', justifyContent: 'center', fontFamily: 'monospace', fontSize: '13px' }}
          onClick={() => setTzDropdownOpen(v => !v)}
          title="Klikk for å endre tidssone"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>{time}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{date}</span>
        </button>
        {tzDropdownOpen && (
          <div className="tz-dropdown">
            {TIMEZONES.map(tz => (
              <div
                key={tz.id}
                className={`tz-option${timezone === tz.id ? ' active' : ''}`}
                onClick={() => { setTimezone(tz.id); setTzDropdownOpen(false); }}
              >
                <span className="tz-abbr">{tz.abbr}</span>
                <span>{tz.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="header-btn" title="Varsler">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span className="notif-count">3</span>
      </button>

      <button className="header-btn primary" onClick={onBroadcast}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="2"/>
          <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
        </svg>
        Kringkast
      </button>

      {/* Fil / Verktøy dropdown */}
      <div className="fil-menu-wrap" ref={filMenuRef}>
        <button
          className={`header-btn${filMenuOpen ? ' active' : ''}`}
          title="Fil og verktøy"
          onClick={() => setFilMenuOpen(v => !v)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          Fil
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {filMenuOpen && (
          <div className="fil-dropdown">
            <button
              className="fil-dropdown-item"
              onClick={() => { setFilMenuOpen(false); onSaveOperation && onSaveOperation(); }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Lagre operasjon
            </button>
            <label className="fil-dropdown-item" style={{ cursor: 'pointer' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              Last inn operasjon
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={(e) => { setFilMenuOpen(false); onLoadOperation && onLoadOperation(e); }} />
            </label>
            <div className="fil-dropdown-divider" />
            <button
              className="fil-dropdown-item"
              onClick={() => { setFilMenuOpen(false); onNewOperation && onNewOperation(); }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Ny operasjon
            </button>
            <div className="fil-dropdown-divider" />
            <button
              className={`fil-dropdown-item${drawAOMode ? ' active' : ''}`}
              onClick={() => { setFilMenuOpen(false); onDrawAO && onDrawAO(); }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="0"/>
              </svg>
              {drawAOMode ? 'Avbryt AO-tegning' : 'Tegn AO'}
            </button>
            <div className="fil-dropdown-divider" />
            {onDeleteOperation && (
              <button
                className="fil-dropdown-item danger"
                onClick={() => { setFilMenuOpen(false); onDeleteOperation(); }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
                Slett operasjon
              </button>
            )}
          </div>
        )}
      </div>

      {/* Settings button */}
      <div className="settings-wrap" ref={settingsRef}>
        <button className="header-btn" title="Innstillinger" onClick={() => setSettingsOpen(v => !v)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Innstillinger
        </button>
        {settingsOpen && (
          <div className="settings-panel">
            <div className="settings-panel-title">⚙ Innstillinger</div>
            <div className="settings-row">
              <label>Forsinkelse før første hendelse (sek)</label>
              <input type="number" value={settings.firstDelay} min="1"
                onChange={e => setSettings(s => ({ ...s, firstDelay: Number(e.target.value) }))} />
            </div>
            <div className="settings-row">
              <label>Intervall mellom hendelser (sek)</label>
              <input type="number" value={settings.interval} min="1"
                onChange={e => setSettings(s => ({ ...s, interval: Number(e.target.value) }))} />
            </div>
            <div className="settings-row">
              <label>Reisetid for enheter (sek)</label>
              <input type="number" value={settings.travelTime} min="1"
                onChange={e => setSettings(s => ({ ...s, travelTime: Number(e.target.value) }))} />
            </div>
            <div className="settings-row">
              <label>Bankran chat-varighet (sek)</label>
              <input type="number" value={settings.bankChatDuration} min="1"
                onChange={e => setSettings(s => ({ ...s, bankChatDuration: Number(e.target.value) }))} />
            </div>
            <div className="settings-row">
              <label>Varslingsintervall (sek)</label>
              <input type="number" value={settings.alertInterval ?? defaultSettings.alertInterval} min="1"
                onChange={e => setSettings(s => ({ ...s, alertInterval: Number(e.target.value) }))} />
            </div>
            <button className="header-btn primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} onClick={applySettings}>
              Bruk innstillinger
            </button>
          </div>
        )}
      </div>

      {/* Admin avatar with panel */}
      <div className="admin-wrap" ref={adminRef}>
        <div className="header-avatar" title="Admin Bruker" onClick={() => setAdminOpen(v => !v)}>AU</div>
        {adminOpen && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div className="admin-avatar-large">AU</div>
              <div>
                <div className="admin-name">Admin Bruker</div>
                <div className="admin-role">Operasjonskoordinator</div>
              </div>
            </div>
            <div className="admin-clearance">TOP SECRET</div>
            <div className="admin-info-row"><span>Org</span><span>Politidirektoratet</span></div>
            <div className="admin-info-row"><span>Enhet</span><span>Nasjonal operasjonssentral</span></div>
            <div className="admin-info-row"><span>E-post</span><span>admin@politiet.no</span></div>
            <div className="admin-info-row"><span>Tjeneste-ID</span><span>POL-OPS-001</span></div>
          </div>
        )}
      </div>
    </header>
  );
}
