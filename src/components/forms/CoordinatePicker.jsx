import React from 'react';

/**
 * Reusable UTM33/ETRS89 coordinate input pair + "Pick from map" button.
 *
 * Props:
 *   utmE            {string}   — easting value
 *   utmN            {string}   — northing value
 *   onChangeE       {fn}       — called with new easting string
 *   onChangeN       {fn}       — called with new northing string
 *   onRequestPick   {fn|null}  — called when "Pick from map" is clicked;
 *                                if null the button is hidden
 */
export default function CoordinatePicker({ utmE, utmN, onChangeE, onChangeN, onRequestPick }) {
  return (
    <div>
      <div className="rp-form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          Koordinater (UTM33/ETRS89){' '}
          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>— valgfri, klikk kart</span>
        </span>
        {onRequestPick && (
          <button className="rp-pick-btn" onClick={onRequestPick}>
            📍 Velg fra kart
          </button>
        )}
      </div>
      <input
        className="rp-input"
        placeholder="Øst (f.eks 597000)"
        value={utmE}
        onChange={e => onChangeE(e.target.value)}
      />
      <input
        className="rp-input"
        placeholder="Nord (f.eks 6644000)"
        value={utmN}
        onChange={e => onChangeN(e.target.value)}
      />
    </div>
  );
}
