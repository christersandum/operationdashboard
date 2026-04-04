import React from 'react';
import CoordinatePicker from './CoordinatePicker';

/**
 * Incident add/edit form.
 *
 * Props:
 *   form              {object}   — { id, title, desc, priority, utmE, utmN, icon }
 *   editId            {string|null}
 *   onChange          {fn}       — called with (key, value)
 *   onRequestPick     {fn|null}
 *   onSave            {fn}
 *   onCancel          {fn}
 */
export default function IncidentForm({ form, editId, onChange, onRequestPick, onSave, onCancel }) {
  return (
    <div className="rp-form">
      <div className="rp-form-title">{editId ? 'Rediger hendelse' : 'Ny hendelse'}</div>
      <input
        className="rp-input"
        placeholder="ID (f.eks HEN-007)"
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
        value={form.priority}
        onChange={e => onChange('priority', e.target.value)}
      >
        <option value="alarm">Alarm</option>
        <option value="high">Høy</option>
        <option value="medium">Medium</option>
        <option value="low">Lav</option>
      </select>
      <input
        className="rp-input"
        placeholder="Ikon (emoji, f.eks 🚨)"
        value={form.icon}
        onChange={e => onChange('icon', e.target.value)}
      />
      <CoordinatePicker
        utmE={form.utmE}
        utmN={form.utmN}
        onChangeE={v => onChange('utmE', v)}
        onChangeN={v => onChange('utmN', v)}
        onRequestPick={onRequestPick ? () => onRequestPick('incident') : null}
      />
      <div className="rp-form-actions">
        <button className="rp-btn" onClick={onCancel}>Avbryt</button>
        <button className="rp-btn primary" onClick={onSave}>Lagre</button>
      </div>
    </div>
  );
}
