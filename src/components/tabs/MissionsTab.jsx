import React, { useMemo } from 'react';

export default function MissionsTab({ missions, units, incidents, onMissionClick }) {
  const openCount = missions.filter(m => m.status !== 'completed').length;

  const grouped = useMemo(() => {
    const map = {};
    missions.forEach(m => {
      if (!map[m.incidentId]) map[m.incidentId] = [];
      map[m.incidentId].push(m);
    });
    return map;
  }, [missions]);

  return (
    <div className="scrollable">
      <div className="section-header">
        <span className="section-title">
          Åpne oppdrag: <span className="section-count">{openCount}</span>
        </span>
      </div>

      {missions.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
          Ingen oppdrag ennå
        </div>
      )}

      {Object.entries(grouped).map(([incidentId, mList]) => {
        const inc = incidents.find(i => i.id === incidentId);
        return (
          <div key={incidentId} className="mission-group">
            <div className="mission-group-header">
              <span>{inc ? `${inc.icon} ${inc.title}` : incidentId}</span>
              <span className="section-count">{mList.filter(m => m.status !== 'completed').length} åpne</span>
            </div>
            {mList.map(mission => {
              const assignedUnits = units.filter(u => mission.assignedUnitIds && mission.assignedUnitIds.includes(u.id));
              const completed = mission.status === 'completed';
              return (
                <div
                  key={mission.id}
                  className={`mission-item${completed ? ' completed' : ''}`}
                  onClick={() => onMissionClick && onMissionClick(mission)}
                  style={{ cursor: onMissionClick ? 'pointer' : 'default' }}
                >
                  <div className="mission-status-dot" style={{ background: completed ? '#2ecc71' : '#e74c3c' }} />
                  <div className="mission-body">
                    <div className="mission-title">{mission.title}</div>
                    <div className="mission-desc">{mission.desc}</div>
                    {assignedUnits.length > 0 && (
                      <div className="mission-units">
                        {assignedUnits.map(u => (
                          <span key={u.id} className="mission-unit-badge">{u.id}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mission-status-label" style={{ color: completed ? '#2ecc71' : '#e74c3c' }}>
                    {completed ? 'FULLFØRT' : 'AKTIV'}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
