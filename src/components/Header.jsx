import React, { useState, useEffect, useRef } from 'react';

export default function Header({
  currentOpId,
  onOperationChange,
  onBroadcast,
}) {
  const [time, setTime]   = useState('--:--:--');
  const [date, setDate]   = useState('');
  const pad = n => String(n).padStart(2, '0');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} UTC`);
      setDate(now.toLocaleDateString('nb-NO', { day: '2-digit', month: 'short' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

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
        <select
          className="operation-select"
          value={currentOpId}
          onChange={e => onOperationChange(e.target.value)}
        >
          <option value="nordic-shield">Operation Nordic Shield</option>
          <option value="norwegian-sword">Operasjon Norwegian Sword</option>
        </select>
      </div>

      {/* Active status */}
      <div className="header-status-badge">
        <div className="status-dot" />
        <span>AKTIV</span>
      </div>

      <div className="header-spacer" />

      {/* Clock */}
      <div className="header-btn" style={{ minWidth: '110px', justifyContent: 'center', fontFamily: 'monospace', fontSize: '13px' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>{time}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{date}</span>
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

      <button className="header-btn" title="Innstillinger">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>

      <div className="header-avatar" title="Admin Bruker">AU</div>
    </header>
  );
}
