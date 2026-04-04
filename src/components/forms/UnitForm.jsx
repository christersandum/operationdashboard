import React from 'react';
import CoordinatePicker from './CoordinatePicker';

/**
 * Unit add/edit form.
 *
 * Props:
 *   form              {object}   — { id, name, role, team, status, utmE, utmN }
 *   editId            {string|null}
 *   onChange          {fn}       — called with partial form update: (key, value)
 *   onRequestPick     {fn|null}
 *   onSave            {fn}
 *   onCancel          {fn}
 */
export default function UnitForm({ form, editId, onChange, onRequestPick, onSave, onCancel }) {
  return (
    <div className="rp-form">
      <div className="rp-form-title">{editId ? 'Rediger enhet' : 'Ny enhet'}</div>
      <input
        className="rp-input"
        placeholder="ID (f.eks P5)"
        value={form.id}
        onChange={e => onChange('id', e.target.value)}
        disabled={!!editId}
      />
      <input
        className="rp-input"
        placeholder="Navn"
        value={form.name}
        onChange={e => onChange('name', e.target.value)}
      />
      <input
        className="rp-input"
        placeholder="Rolle"
        value={form.role}
        onChange={e => onChange('role', e.target.value)}
      />
      <input
        className="rp-input"
        placeholder="Team (f.eks Patrulje, Delta)"
        value={form.team}
        onChange={e => onChange('team', e.target.value)}
      />
      <select
        className="rp-input"
        value={form.status}
        onChange={e => onChange('status', e.target.value)}
      >
        <option value="online">Online / Ledig</option>
        <option value="opptatt">Opptatt</option>
        <option value="warning">Advarsel</option>
        <option value="offline">Offline</option>
      </select>
      <CoordinatePicker
        utmE={form.utmE}
        utmN={form.utmN}
        onChangeE={v => onChange('utmE', v)}
        onChangeN={v => onChange('utmN', v)}
        onRequestPick={onRequestPick ? () => onRequestPick('unit') : null}
      />
      <div className="rp-form-actions">
        <button className="rp-btn" onClick={onCancel}>Avbryt</button>
        <button className="rp-btn primary" onClick={onSave}>Lagre</button>
      </div>
    </div>
  );
}
