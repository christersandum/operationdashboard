import React, { useState, useMemo } from 'react';
import { INCIDENT_COLORS } from '../../data';

const TEAM_UNKNOWN = 'Ukjent';

export default function UnitsTab({ units, incidents, onUnitClick }) {
  const [query,  setQuery]  = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [collapsedTeams, setCollapsedTeams] = useState({});

  const filtered = useMemo(() => {
    return units.filter(u => {
      const q = query.toLowerCase();
      const matchQ = !q
        || u.name.toLowerCase().includes(q)
        || u.role.toLowerCase().includes(q)
        || u.id.toLowerCase().includes(q)
        || (u.team || '').toLowerCase().includes(q);
      const matchF = filter === 'all'
        || (filter === 'ledig'   && (u.status === 'ledig' || u.status === 'online') && !u.assignedIncident)
        || (filter === 'opptatt' && (u.status === 'opptatt' || (u.assignedIncident && u.status !== 'offline')))
        || (filter === 'moving'  && u.moving)
        || (filter === 'offline' && u.status === 'offline');
      return matchQ && matchF;
    });
  }, [units, query, filter]);

  // Group by team
  const teamGroups = useMemo(() => {
    const map = {};
    filtered.forEach(u => {
      const team = u.team || TEAM_UNKNOWN;
      if (!map[team]) map[team] = [];
      map[team].push(u);
    });
    return map;
  }, [filtered]);

  // Map incidentId → incident for colored assignment badges
  const incidentMap = useMemo(() => {
    const m = {};
    incidents.forEach(inc => { m[inc.id] = inc; });
    return m;
  }, [incidents]);

  const handleClick = (unit) => {
    setSelectedId(unit.id);
    if (onUnitClick) onUnitClick(unit);
  };

  const toggleTeam = (team) => {
    setCollapsedTeams(prev => ({ ...prev, [team]: !prev[team] }));
  };

  const filterDefs = [
    { id: 'all',     label: 'Alle' },
    { id: 'ledig',   label: 'Ledig' },
    { id: 'opptatt', label: 'Opptatt' },
    { id: 'moving',  label: 'I bevegelse' },
    { id: 'offline', label: 'Offline' },
  ];

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
        {filterDefs.map(f => (
          <span
            key={f.id}
            className={`filter-pill${filter === f.id ? ' active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </span>
        ))}
      </div>

      <div className="scrollable">
        {filtered.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            Ingen enheter funnet
          </div>
        )}

        {Object.entries(teamGroups).map(([team, teamUnits]) => {
          const isCollapsed = !!collapsedTeams[team];
          return (
            <React.Fragment key={team}>
              <div
                className="group-header"
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => toggleTeam(team)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {isCollapsed ? '▶' : '▼'}
                  </span>
                  <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{team}</span>
                </span>
                <span>{teamUnits.length}</span>
              </div>
              {!isCollapsed && teamUnits.map(u => {
                const inc = u.assignedIncident ? incidentMap[u.assignedIncident] : null;
                const incColor = inc ? INCIDENT_COLORS[inc.colorIndex ?? 0] : null;
                return (
                  <UnitItem
                    key={u.id}
                    unit={u}
                    selected={selectedId === u.id}
                    onClick={handleClick}
                    incidentColor={incColor}
                  />
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </>
  );
}

function getStatusColor(unit) {
  if (unit.status === 'offline') return '#6b7280';
  if (unit.status === 'warning') return '#f39c12';
  if (unit.status === 'opptatt') return '#f39c12';
  if (unit.assignedIncident)    return '#f39c12'; // assigned = opptatt
  return '#2ecc71'; // ledig / online
}

function getStatusText(unit) {
  if (unit.status === 'offline') return 'Offline';
  if (unit.status === 'opptatt' || (unit.assignedIncident && unit.status !== 'offline')) return 'Opptatt';
  return 'Ledig';
}

function UnitItem({ unit, selected, onClick, incidentColor }) {
  const statusColor = getStatusColor(unit);
  const statusText  = getStatusText(unit);
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
        <div className="participant-time" style={{ color: statusColor }}>{statusText}</div>
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
