import React, { useState, useMemo } from 'react';
import { INCIDENT_COLORS } from '../../data';

export default function UnitsTab({ units, incidents, onUnitClick }) {
  const [query,  setQuery]  = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);

  const filtered = useMemo(() => {
    return units.filter(u => {
      const q = query.toLowerCase();
      const matchQ = !q
        || u.name.toLowerCase().includes(q)
        || u.role.toLowerCase().includes(q)
        || u.id.toLowerCase().includes(q);
      const matchF = filter === 'all'
        || (filter === 'online'  && u.status === 'online')
        || (filter === 'moving'  && u.moving)
        || (filter === 'offline' && u.status === 'offline');
      return matchQ && matchF;
    });
  }, [units, query, filter]);

  // Group by incident assignment, then unassigned
  const groups = useMemo(() => {
    const unassigned = filtered.filter(u => !u.assignedIncident);
    const incidentGroups = {};

    incidents.forEach(inc => {
      const inGroup = filtered.filter(u => u.assignedIncident === inc.id);
      if (inGroup.length > 0) {
        incidentGroups[inc.id] = { incident: inc, units: inGroup };
      }
    });

    return { unassigned, incidentGroups };
  }, [filtered, incidents]);

  const handleClick = (unit) => {
    setSelectedId(unit.id);
    if (onUnitClick) onUnitClick(unit);
  };

  return (
    <>
      <div className="section-header">
        <span className="section-title">
          Feltenheter
          <span className="section-count">{units.length} enheter</span>
        </span>
        <div className="section-actions">
          <button className="icon-btn" title="Legg til enhet">
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
            placeholder="Søk enheter…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="filter-pills">
        {['all', 'online', 'moving', 'offline'].map(f => (
          <span
            key={f}
            className={`filter-pill${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Alle' : f === 'online' ? 'Online' : f === 'moving' ? 'I bevegelse' : 'Offline'}
          </span>
        ))}
      </div>

      <div className="scrollable">
        {filtered.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            Ingen enheter funnet
          </div>
        )}

        {/* Unassigned group */}
        {groups.unassigned.length > 0 && (
          <>
            <div className="group-header">
              <span style={{ color: 'var(--text-muted)' }}>● Ikke tildelt</span>
              <span>{groups.unassigned.length}</span>
            </div>
            {groups.unassigned.map(u => (
              <UnitItem key={u.id} unit={u} selected={selectedId === u.id} onClick={handleClick} />
            ))}
          </>
        )}

        {/* Incident groups */}
        {Object.values(groups.incidentGroups).map(({ incident, units: gu }, idx) => {
          const incColor = INCIDENT_COLORS[incident.colorIndex ?? idx % INCIDENT_COLORS.length];
          return (
            <React.Fragment key={incident.id}>
              <div className="group-header">
                <span style={{ color: incColor }}>
                  {incident.icon} {incident.title}
                </span>
                <span>{gu.length}</span>
              </div>
              {gu.map(u => (
                <UnitItem key={u.id} unit={u} selected={selectedId === u.id} onClick={handleClick} incidentColor={incColor} />
              ))}
            </React.Fragment>
          );
        })}
      </div>
    </>
  );
}

function UnitItem({ unit, selected, onClick, incidentColor }) {
  const statusColor = unit.status === 'online' ? '#2ecc71'
    : unit.status === 'warning' ? '#f39c12' : '#6b7280';
  const avatarColor = incidentColor || '#6b7280';

  return (
    <div
      className={`participant-item${selected ? ' selected' : ''}`}
      onClick={() => onClick(unit)}
    >
      <div className="participant-avatar" style={{ background: avatarColor }}>
        <span style={{ fontSize: '9px', fontWeight: 700, color: '#fff' }}>{unit.id}</span>
        <div className="participant-status-dot" style={{ background: statusColor }} />
      </div>
      <div className="participant-info">
        <div className="participant-name">{unit.name}</div>
        <div className="participant-role">
          {unit.role}{unit.moving ? ' · Beveger seg' : ''}
        </div>
        {unit.assignedIncident && (
          <div className="participant-assigned" style={{ color: incidentColor || 'var(--accent-orange)' }}>
            → {unit.assignedIncident}
          </div>
        )}
      </div>
      <div className="participant-meta">
        <div className="participant-time">{unit.status === 'offline' ? 'Offline' : 'Live'}</div>
        <div className="participant-signal">
          {[1,2,3,4].map(i => (
            <div
              key={i}
              className={`signal-bar${i <= (unit.signal ?? 4) ? ' active' : ''}`}
              style={{ height: `${4 + i * 3}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
