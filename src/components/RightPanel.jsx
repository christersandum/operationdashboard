import React, { useState } from 'react';

export default function RightPanel({
  open,
  onToggle,
  units,
  incidents,
  missions,
  onAddUnit,
  onEditUnit,
  onDeleteUnit,
  onAddIncident,
  onEditIncident,
  onDeleteIncident,
  onAddMission,
  onEditMission,
  onDeleteMission,
  onAutoAssign,
}) {
  const [activeTab, setActiveTab] = useState('units');
  const [unitForm, setUnitForm] = useState({ id: '', name: '', role: '', status: 'online', lat: '', lng: '' });
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [editUnitId, setEditUnitId] = useState(null);
  
  const [incidentForm, setIncidentForm] = useState({ id: '', title: '', desc: '', priority: 'medium', lat: '', lng: '', icon: '🚨' });
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [editIncidentId, setEditIncidentId] = useState(null);
  
  const [missionForm, setMissionForm] = useState({ id: '', title: '', desc: '', incidentId: '', assignedUnitIds: [] });
  const [showMissionForm, setShowMissionForm] = useState(false);
  const [editMissionId, setEditMissionId] = useState(null);

  const openAddUnit = () => {
    setUnitForm({ id: '', name: '', role: '', status: 'online', lat: '', lng: '' });
    setEditUnitId(null);
    setShowUnitForm(true);
  };
  const openEditUnit = (unit) => {
    setUnitForm({ id: unit.id, name: unit.name, role: unit.role, status: unit.status, lat: unit.lat, lng: unit.lng });
    setEditUnitId(unit.id);
    setShowUnitForm(true);
  };
  const saveUnit = () => {
    const data = { ...unitForm, lat: parseFloat(unitForm.lat) || 0, lng: parseFloat(unitForm.lng) || 0 };
    if (editUnitId) {
      onEditUnit(editUnitId, data);
    } else {
      if (!data.id) data.id = 'U' + Date.now();
      onAddUnit(data);
    }
    setShowUnitForm(false);
  };

  const openAddIncident = () => {
    setIncidentForm({ id: '', title: '', desc: '', priority: 'medium', lat: '', lng: '', icon: '🚨' });
    setEditIncidentId(null);
    setShowIncidentForm(true);
  };
  const openEditIncident = (inc) => {
    setIncidentForm({ id: inc.id, title: inc.title, desc: inc.desc, priority: inc.priority, lat: inc.lat, lng: inc.lng, icon: inc.icon || '🚨' });
    setEditIncidentId(inc.id);
    setShowIncidentForm(true);
  };
  const saveIncident = () => {
    const data = { ...incidentForm, lat: parseFloat(incidentForm.lat) || 0, lng: parseFloat(incidentForm.lng) || 0 };
    if (editIncidentId) {
      onEditIncident(editIncidentId, data);
    } else {
      if (!data.id) data.id = 'HEN-' + Date.now();
      onAddIncident(data);
    }
    setShowIncidentForm(false);
  };

  const openAddMission = () => {
    setMissionForm({ id: '', title: '', desc: '', incidentId: (incidents || [])[0]?.id || '', assignedUnitIds: [] });
    setEditMissionId(null);
    setShowMissionForm(true);
  };
  const openEditMission = (m) => {
    setMissionForm({ id: m.id, title: m.title, desc: m.desc, incidentId: m.incidentId, assignedUnitIds: m.assignedUnitIds || [] });
    setEditMissionId(m.id);
    setShowMissionForm(true);
  };
  const saveMission = () => {
    if (editMissionId) {
      onEditMission(editMissionId, missionForm);
    } else {
      const data = { ...missionForm, id: missionForm.id || 'OPP-' + Date.now(), status: 'active' };
      onAddMission(data);
    }
    setShowMissionForm(false);
  };

  const toggleAssignUnit = (unitId) => {
    const ids = missionForm.assignedUnitIds || [];
    const updated = ids.includes(unitId) ? ids.filter(id => id !== unitId) : [...ids, unitId];
    setMissionForm(f => ({ ...f, assignedUnitIds: updated }));
  };

  return (
    <div className={`right-panel${open ? ' open' : ''}`}>
      <button className="right-panel-toggle" onClick={onToggle} title={open ? 'Skjul panel' : 'Åpne panel'}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          {open
            ? <polyline points="9 18 15 12 9 6" />
            : <polyline points="15 18 9 12 15 6" />}
        </svg>
        {!open && <span className="right-panel-toggle-label">Rediger</span>}
      </button>

      {open && (
        <div className="right-panel-content">
          <div className="right-panel-header">
            <span>Rediger operasjon</span>
          </div>

          <div className="right-panel-tabs">
            {[
              { id: 'units', label: 'Enheter' },
              { id: 'incidents', label: 'Hendelser' },
              { id: 'missions', label: 'Oppdrag' },
            ].map(t => (
              <button
                key={t.id}
                className={`right-panel-tab${activeTab === t.id ? ' active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="right-panel-body">
            {activeTab === 'units' && (
              <div>
                <div className="right-panel-section-header">
                  <span>Enheter ({units.length})</span>
                  <button className="rp-add-btn" onClick={openAddUnit}>+ Legg til</button>
                </div>
                {showUnitForm && (
                  <div className="rp-form">
                    <div className="rp-form-title">{editUnitId ? 'Rediger enhet' : 'Ny enhet'}</div>
                    <input className="rp-input" placeholder="ID (f.eks P5)" value={unitForm.id} onChange={e => setUnitForm(f => ({ ...f, id: e.target.value }))} disabled={!!editUnitId} />
                    <input className="rp-input" placeholder="Navn" value={unitForm.name} onChange={e => setUnitForm(f => ({ ...f, name: e.target.value }))} />
                    <input className="rp-input" placeholder="Rolle" value={unitForm.role} onChange={e => setUnitForm(f => ({ ...f, role: e.target.value }))} />
                    <select className="rp-input" value={unitForm.status} onChange={e => setUnitForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="online">Online / Ledig</option>
                      <option value="opptatt">Opptatt</option>
                      <option value="warning">Advarsel</option>
                      <option value="offline">Offline</option>
                    </select>
                    <input className="rp-input" placeholder="Lat (f.eks 59.91)" value={unitForm.lat} onChange={e => setUnitForm(f => ({ ...f, lat: e.target.value }))} />
                    <input className="rp-input" placeholder="Lng (f.eks 10.74)" value={unitForm.lng} onChange={e => setUnitForm(f => ({ ...f, lng: e.target.value }))} />
                    <div className="rp-form-actions">
                      <button className="rp-btn" onClick={() => setShowUnitForm(false)}>Avbryt</button>
                      <button className="rp-btn primary" onClick={saveUnit}>Lagre</button>
                    </div>
                  </div>
                )}
                <div className="rp-list">
                  {units.map(u => (
                    <div key={u.id} className="rp-item">
                      <div className="rp-item-info">
                        <span className="rp-item-id">{u.id}</span>
                        <span className="rp-item-name">{u.name}</span>
                        <span className="rp-item-sub">{u.role} · {u.status}</span>
                      </div>
                      <div className="rp-item-actions">
                        <button className="rp-icon-btn" title="Rediger" onClick={() => openEditUnit(u)}>✏</button>
                        <button className="rp-icon-btn danger" title="Slett" onClick={() => onDeleteUnit(u.id)}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'incidents' && (
              <div>
                <div className="right-panel-section-header">
                  <span>Hendelser ({incidents.length})</span>
                  <button className="rp-add-btn" onClick={openAddIncident}>+ Legg til</button>
                </div>
                {showIncidentForm && (
                  <div className="rp-form">
                    <div className="rp-form-title">{editIncidentId ? 'Rediger hendelse' : 'Ny hendelse'}</div>
                    <input className="rp-input" placeholder="ID (f.eks HEN-007)" value={incidentForm.id} onChange={e => setIncidentForm(f => ({ ...f, id: e.target.value }))} disabled={!!editIncidentId} />
                    <input className="rp-input" placeholder="Tittel" value={incidentForm.title} onChange={e => setIncidentForm(f => ({ ...f, title: e.target.value }))} />
                    <textarea className="rp-input" placeholder="Beskrivelse" value={incidentForm.desc} onChange={e => setIncidentForm(f => ({ ...f, desc: e.target.value }))} rows={2} style={{ resize: 'vertical' }} />
                    <select className="rp-input" value={incidentForm.priority} onChange={e => setIncidentForm(f => ({ ...f, priority: e.target.value }))}>
                      <option value="alarm">Alarm</option>
                      <option value="high">Høy</option>
                      <option value="medium">Medium</option>
                      <option value="low">Lav</option>
                    </select>
                    <input className="rp-input" placeholder="Ikon (emoji, f.eks 🚨)" value={incidentForm.icon} onChange={e => setIncidentForm(f => ({ ...f, icon: e.target.value }))} />
                    <input className="rp-input" placeholder="Lat (f.eks 59.91)" value={incidentForm.lat} onChange={e => setIncidentForm(f => ({ ...f, lat: e.target.value }))} />
                    <input className="rp-input" placeholder="Lng (f.eks 10.74)" value={incidentForm.lng} onChange={e => setIncidentForm(f => ({ ...f, lng: e.target.value }))} />
                    <div className="rp-form-actions">
                      <button className="rp-btn" onClick={() => setShowIncidentForm(false)}>Avbryt</button>
                      <button className="rp-btn primary" onClick={saveIncident}>Lagre</button>
                    </div>
                  </div>
                )}
                <div className="rp-list">
                  {incidents.map(inc => (
                    <div key={inc.id} className="rp-item">
                      <div className="rp-item-info">
                        <span className="rp-item-id">{inc.icon} {inc.id}</span>
                        <span className="rp-item-name">{inc.title}</span>
                        <span className="rp-item-sub">{inc.priority}</span>
                      </div>
                      <div className="rp-item-actions">
                        <button className="rp-icon-btn" title="Rediger" onClick={() => openEditIncident(inc)}>✏</button>
                        <button className="rp-icon-btn danger" title="Slett" onClick={() => onDeleteIncident(inc.id)}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'missions' && (
              <div>
                <div className="right-panel-section-header">
                  <span>Oppdrag ({missions.length})</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="rp-add-btn" title="Auto-tildel nærmeste enhet" onClick={onAutoAssign}>⚡ Auto</button>
                    <button className="rp-add-btn" onClick={openAddMission}>+ Legg til</button>
                  </div>
                </div>
                {showMissionForm && (
                  <div className="rp-form">
                    <div className="rp-form-title">{editMissionId ? 'Rediger oppdrag' : 'Nytt oppdrag'}</div>
                    <input className="rp-input" placeholder="ID (f.eks OPP-014)" value={missionForm.id} onChange={e => setMissionForm(f => ({ ...f, id: e.target.value }))} disabled={!!editMissionId} />
                    <input className="rp-input" placeholder="Tittel" value={missionForm.title} onChange={e => setMissionForm(f => ({ ...f, title: e.target.value }))} />
                    <textarea className="rp-input" placeholder="Beskrivelse" value={missionForm.desc} onChange={e => setMissionForm(f => ({ ...f, desc: e.target.value }))} rows={2} style={{ resize: 'vertical' }} />
                    <select className="rp-input" value={missionForm.incidentId} onChange={e => setMissionForm(f => ({ ...f, incidentId: e.target.value }))}>
                      <option value="">-- Velg hendelse --</option>
                      {incidents.map(i => <option key={i.id} value={i.id}>{i.id}: {i.title}</option>)}
                    </select>
                    <div className="rp-form-label">Tildel enheter:</div>
                    <div className="rp-unit-checkboxes">
                      {units.filter(u => u.status !== 'offline').map(u => (
                        <label key={u.id} className="rp-unit-checkbox">
                          <input
                            type="checkbox"
                            checked={(missionForm.assignedUnitIds || []).includes(u.id)}
                            onChange={() => toggleAssignUnit(u.id)}
                          />
                          {u.id} — {u.name}
                        </label>
                      ))}
                    </div>
                    <div className="rp-form-actions">
                      <button className="rp-btn" onClick={() => setShowMissionForm(false)}>Avbryt</button>
                      <button className="rp-btn primary" onClick={saveMission}>Lagre</button>
                    </div>
                  </div>
                )}
                <div className="rp-list">
                  {missions.map(m => {
                    const inc = incidents.find(i => i.id === m.incidentId);
                    return (
                      <div key={m.id} className="rp-item">
                        <div className="rp-item-info">
                          <span className="rp-item-id">{m.id}</span>
                          <span className="rp-item-name">{m.title}</span>
                          <span className="rp-item-sub">
                            {inc?.title || m.incidentId} · {m.status}
                            {m.assignedUnitIds?.length > 0 && ` · ${m.assignedUnitIds.join(', ')}`}
                          </span>
                        </div>
                        <div className="rp-item-actions">
                          <button className="rp-icon-btn" title="Rediger" onClick={() => openEditMission(m)}>✏</button>
                          <button className="rp-icon-btn danger" title="Slett" onClick={() => onDeleteMission(m.id)}>🗑</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
