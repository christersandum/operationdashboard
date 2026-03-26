import React, { useState, useEffect } from 'react';
import {
  CalciteShellPanel,
  CalciteActionBar,
  CalciteAction,
  CalcitePanel,
} from '@esri/calcite-components-react';
import { wgs84ToUTM33N, utm33NToWGS84 } from '../utils/coordUtils';

// ── Helper: format a WGS84 lat,lng as UTM33 strings for form inputs ──
function latLngToUtmStrings(lat, lng) {
  if (lat === '' || lng === '' || lat == null || lng == null) return { e: '', n: '' };
  const parsed = { lat: parseFloat(lat), lng: parseFloat(lng) };
  if (isNaN(parsed.lat) || isNaN(parsed.lng)) return { e: '', n: '' };
  const utm = wgs84ToUTM33N(parsed.lat, parsed.lng);
  return { e: String(utm.easting), n: String(utm.northing) };
}

// ── Helper: parse UTM33 strings to WGS84 lat,lng ──
function utmStringsToLatLng(eStr, nStr) {
  const e = parseFloat(eStr);
  const n = parseFloat(nStr);
  if (isNaN(e) || isNaN(n)) return { lat: 0, lng: 0 };
  return utm33NToWGS84(e, n);
}

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
  onRequestPickLocation,
  pickedLocation,
  width,
  mapCenter,
}) {
  const [activeTab, setActiveTab] = useState('units');

  // Unit form — stores UTM33 easting/northing as strings
  const [unitForm, setUnitForm] = useState({ id: '', name: '', role: '', status: 'online', utmE: '', utmN: '' });
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [editUnitId, setEditUnitId] = useState(null);

  // Incident form
  const [incidentForm, setIncidentForm] = useState({ id: '', title: '', desc: '', priority: 'medium', utmE: '', utmN: '', icon: '🚨' });
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [editIncidentId, setEditIncidentId] = useState(null);

  // Mission form (missions have no direct coordinates)
  const [missionForm, setMissionForm] = useState({ id: '', title: '', desc: '', incidentId: '', assignedUnitIds: [] });
  const [showMissionForm, setShowMissionForm] = useState(false);
  const [editMissionId, setEditMissionId] = useState(null);

  // ── Apply picked location from map ────────────────────────
  useEffect(() => {
    if (!pickedLocation) return;
    const utm = pickedLocation.utm || wgs84ToUTM33N(pickedLocation.lat, pickedLocation.lng);
    const eStr = String(utm.easting);
    const nStr = String(utm.northing);
    if (pickedLocation.forForm === 'unit' && showUnitForm) {
      setUnitForm(f => ({ ...f, utmE: eStr, utmN: nStr }));
    } else if (pickedLocation.forForm === 'incident' && showIncidentForm) {
      setIncidentForm(f => ({ ...f, utmE: eStr, utmN: nStr }));
    }
  }, [pickedLocation, showUnitForm, showIncidentForm]);

  // ── Unit helpers ──────────────────────────────────────────
  const openAddUnit = () => {
    setUnitForm({ id: '', name: '', role: '', status: 'online', utmE: '', utmN: '' });
    setEditUnitId(null);
    setShowUnitForm(true);
  };
  const openEditUnit = (unit) => {
    const { e, n } = latLngToUtmStrings(unit.lat, unit.lng);
    setUnitForm({ id: unit.id, name: unit.name, role: unit.role, status: unit.status, utmE: e, utmN: n });
    setEditUnitId(unit.id);
    setShowUnitForm(true);
  };
  const saveUnit = () => {
    let lat, lng;
    if (unitForm.utmE && unitForm.utmN) {
      const result = utmStringsToLatLng(unitForm.utmE, unitForm.utmN);
      lat = result.lat;
      lng = result.lng;
    } else if (mapCenter) {
      lng = mapCenter[0];
      lat = mapCenter[1];
    } else {
      lat = 59.913;
      lng = 10.741;
    }
    const data = {
      id: unitForm.id,
      name: unitForm.name,
      role: unitForm.role,
      status: unitForm.status,
      lat,
      lng,
    };
    if (editUnitId) {
      onEditUnit(editUnitId, data);
    } else {
      if (!data.id) data.id = 'U' + Date.now();
      onAddUnit(data);
    }
    setShowUnitForm(false);
  };

  // ── Incident helpers ──────────────────────────────────────
  const openAddIncident = () => {
    setIncidentForm({ id: '', title: '', desc: '', priority: 'medium', utmE: '', utmN: '', icon: '🚨' });
    setEditIncidentId(null);
    setShowIncidentForm(true);
  };
  const openEditIncident = (inc) => {
    const { e, n } = latLngToUtmStrings(inc.lat, inc.lng);
    setIncidentForm({ id: inc.id, title: inc.title, desc: inc.desc, priority: inc.priority, utmE: e, utmN: n, icon: inc.icon || '🚨' });
    setEditIncidentId(inc.id);
    setShowIncidentForm(true);
  };
  const saveIncident = () => {
    let lat, lng;
    if (incidentForm.utmE && incidentForm.utmN) {
      const result = utmStringsToLatLng(incidentForm.utmE, incidentForm.utmN);
      lat = result.lat;
      lng = result.lng;
    } else if (mapCenter) {
      lng = mapCenter[0];
      lat = mapCenter[1];
    } else {
      lat = 59.913;
      lng = 10.741;
    }
    const data = {
      id: incidentForm.id,
      title: incidentForm.title,
      desc: incidentForm.desc,
      priority: incidentForm.priority,
      icon: incidentForm.icon,
      lat,
      lng,
    };
    if (editIncidentId) {
      onEditIncident(editIncidentId, data);
    } else {
      if (!data.id) data.id = 'HEN-' + Date.now();
      onAddIncident(data);
    }
    setShowIncidentForm(false);
  };

  // ── Mission helpers ───────────────────────────────────────
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
    <CalciteShellPanel
      slot="panel-end"
      position="end"
      displayMode="dock"
      collapsed={!open || undefined}
      style={open && width ? { '--calcite-shell-panel-width': `${width}px` } : undefined}
    >
      <CalciteActionBar slot="action-bar">
        <CalciteAction
          icon={open ? 'chevron-right' : 'pencil'}
          text="Rediger"
          onClick={onToggle}
        />
      </CalciteActionBar>

      {open && (
        <CalcitePanel heading="Rediger operasjon" style={{ height: '100%' }}>
          <div className="right-panel-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--calcite-color-border-1)', padding: '0 8px' }}>
            {[
              { id: 'units',     label: 'Enheter'   },
              { id: 'incidents', label: 'Hendelser' },
              { id: 'missions',  label: 'Oppdrag'   },
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

          <div className="right-panel-body" style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
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
                    <div className="rp-form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Koordinater (UTM33/ETRS89) <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>— valgfri, klikk kart</span></span>
                      {onRequestPickLocation && (
                        <button className="rp-pick-btn" onClick={() => onRequestPickLocation('unit')}>
                          📍 Velg fra kart
                        </button>
                      )}
                    </div>
                    <input className="rp-input" placeholder="Øst (f.eks 597000)" value={unitForm.utmE} onChange={e => setUnitForm(f => ({ ...f, utmE: e.target.value }))} />
                    <input className="rp-input" placeholder="Nord (f.eks 6644000)" value={unitForm.utmN} onChange={e => setUnitForm(f => ({ ...f, utmN: e.target.value }))} />
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
                        <button className="rp-icon-btn" title="Rediger" aria-label={`Rediger enhet ${u.name}`} onClick={() => openEditUnit(u)}>✏</button>
                        <button className="rp-icon-btn danger" title="Slett" aria-label={`Slett enhet ${u.name}`} onClick={() => onDeleteUnit(u.id)}>🗑</button>
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
                    <div className="rp-form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Koordinater (UTM33/ETRS89) <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>— valgfri, klikk kart</span></span>
                      {onRequestPickLocation && (
                        <button className="rp-pick-btn" onClick={() => onRequestPickLocation('incident')}>
                          📍 Velg fra kart
                        </button>
                      )}
                    </div>
                    <input className="rp-input" placeholder="Øst (f.eks 597000)" value={incidentForm.utmE} onChange={e => setIncidentForm(f => ({ ...f, utmE: e.target.value }))} />
                    <input className="rp-input" placeholder="Nord (f.eks 6644000)" value={incidentForm.utmN} onChange={e => setIncidentForm(f => ({ ...f, utmN: e.target.value }))} />
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
                        <button className="rp-icon-btn" title="Rediger" aria-label={`Rediger hendelse ${inc.title}`} onClick={() => openEditIncident(inc)}>✏</button>
                        <button className="rp-icon-btn danger" title="Slett" aria-label={`Slett hendelse ${inc.title}`} onClick={() => onDeleteIncident(inc.id)}>🗑</button>
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
                          <button className="rp-icon-btn" title="Rediger" aria-label={`Rediger oppdrag ${m.title}`} onClick={() => openEditMission(m)}>✏</button>
                          <button className="rp-icon-btn danger" title="Slett" aria-label={`Slett oppdrag ${m.title}`} onClick={() => onDeleteMission(m.id)}>🗑</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CalcitePanel>
      )}
    </CalciteShellPanel>
  );
}
