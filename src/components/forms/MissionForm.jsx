import React from 'react';

/**
 * Mission add/edit form.
 *
 * Props:
 *   form              {object}   — { id, title, desc, incidentId, assignedUnitIds }
 *   editId            {string|null}
 *   incidents         {array}
 *   units             {array}
 *   onChange          {fn}       — called with (key, value)
 *   onToggleUnit      {fn}       — called with unitId to toggle assignment
 *   onSave            {fn}
 *   onCancel          {fn}
 */
export default function MissionForm({ form, editId, incidents, units, onChange, onToggleUnit, onSave, onCancel }) {
  return (
    <div className="rp-form">
      <div className="rp-form-title">{editId ? 'Rediger oppdrag' : 'Nytt oppdrag'}</div>
      <input
        className="rp-input"
        placeholder="ID (f.eks OPP-014)"
        value={form.id}
        onChange={e => onChange('id', e.target.value)}
        disabled={!!editId}
      />
      <input
        className="rp-input"
        placeholder="Tittel"
        value={form.title}
        onChange={e => onChange('title', e.target.value)}
      />
      <textarea
        className="rp-input"
        placeholder="Beskrivelse"
        value={form.desc}
        onChange={e => onChange('desc', e.target.value)}
        rows={2}
        style={{ resize: 'vertical' }}
      />
      <select
        className="rp-input"
        value={form.incidentId}
        onChange={e => onChange('incidentId', e.target.value)}
      >
        <option value="">-- Velg hendelse --</option>
        {(incidents || []).map(i => (
          <option key={i.id} value={i.id}>{i.id}: {i.title}</option>
        ))}
      </select>
      <div className="rp-form-label">Tildel enheter:</div>
      <div className="rp-unit-checkboxes">
        {(units || []).filter(u => u.status !== 'offline').map(u => (
          <label key={u.id} className="rp-unit-checkbox">
            <input
              type="checkbox"
              checked={(form.assignedUnitIds || []).includes(u.id)}
              onChange={() => onToggleUnit(u.id)}
            />
            {u.id} — {u.name}
          </label>
        ))}
      </div>
      <div className="rp-form-actions">
        <button className="rp-btn" onClick={onCancel}>Avbryt</button>
        <button className="rp-btn primary" onClick={onSave}>Lagre</button>
      </div>
    </div>
  );
}
