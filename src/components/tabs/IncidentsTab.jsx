import React, { useState, useMemo } from 'react';

export default function IncidentsTab({ incidents, units, onIncidentClick }) {
  const [query,  setQuery]  = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    return incidents.filter(inc => {
      const q = query.toLowerCase();
      const matchQ = !q
        || inc.title.toLowerCase().includes(q)
        || inc.id.toLowerCase().includes(q);
      const matchF = filter === 'all' || inc.priority === filter;
      return matchQ && matchF;
    });
  }, [incidents, query, filter]);

  return (
    <>
      <div className="section-header">
        <span className="section-title">
          Hendelser
          <span className="section-count">{incidents.length} åpne</span>
        </span>
        <div className="section-actions">
          <button className="icon-btn" title="Rapporter hendelse">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="search-container">
        <div className="search-input-wrap">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Søk hendelser…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="filter-pills">
        {['all', 'high', 'medium', 'low'].map(f => (
          <span
            key={f}
            className={`filter-pill${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Alle' : f === 'high' ? 'Høy' : f === 'medium' ? 'Medium' : 'Lav'}
          </span>
        ))}
      </div>

      <div className="scrollable">
        {filtered.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            Ingen hendelser funnet
          </div>
        )}
        {filtered.map(inc => {
          const assignedUnits = units.filter(u => u.assignedIncident === inc.id);
          const priorityColor = inc.priority === 'high' ? 'var(--accent-red)'
            : inc.priority === 'medium' ? 'var(--accent-orange)' : 'var(--accent-green)';
          const priorityLabel = inc.priority === 'high' ? 'høy'
            : inc.priority === 'medium' ? 'medium' : 'lav';

          return (
            <div
              key={inc.id}
              className="incident-item"
              onClick={() => onIncidentClick && onIncidentClick(inc)}
            >
              <div
                className="incident-icon"
                style={{ background: `color-mix(in srgb, ${priorityColor} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${priorityColor} 40%, transparent)` }}
              >
                {inc.icon}
              </div>
              <div className="incident-info">
                <div className="incident-title">{inc.title}</div>
                <div className="incident-desc">{inc.desc}</div>
                {assignedUnits.length > 0 && (
                  <div className="incident-units">
                    🚓 {assignedUnits.map(u => u.name).join(', ')}
                  </div>
                )}
              </div>
              <div className="incident-meta">
                <div className="incident-time">{inc.time || '--'}</div>
                <div className={`priority-badge priority-${inc.priority}`}>{priorityLabel}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
