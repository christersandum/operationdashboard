import React, { useState } from 'react';
import { SYMBOLS } from '../../data';

export default function SymbolLibraryTab() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  const categories = ['all', ...new Set(SYMBOLS.map(s => s.category))];
  const filtered = filter === 'all' ? SYMBOLS : SYMBOLS.filter(s => s.category === filter);

  return (
    <div className="scrollable">
      <div className="section-header">
        <span className="section-title">Symbolbibliotek</span>
      </div>
      <div className="filter-pills" style={{ padding: '8px 12px' }}>
        {categories.map(c => (
          <span
            key={c}
            className={`filter-pill${filter === c ? ' active' : ''}`}
            onClick={() => setFilter(c)}
          >
            {c === 'all' ? 'Alle' : c}
          </span>
        ))}
      </div>
      <div className="symbol-grid">
        {filtered.map(sym => (
          <div
            key={sym.id}
            className={`symbol-card${selected?.id === sym.id ? ' selected' : ''}`}
            onClick={() => setSelected(sym)}
            title={sym.description}
          >
            <div className="symbol-icon" style={{ background: sym.bgColor || 'rgba(0,120,212,0.15)', color: sym.color || '#0078d4' }}>
              {sym.icon}
            </div>
            <div className="symbol-name">{sym.name}</div>
          </div>
        ))}
      </div>
      {selected && (
        <div className="symbol-detail">
          <div className="symbol-detail-icon" style={{ background: selected.bgColor || 'rgba(0,120,212,0.15)', color: selected.color || '#0078d4' }}>
            {selected.icon}
          </div>
          <div>
            <div className="symbol-detail-name">{selected.name}</div>
            <div className="symbol-detail-cat">{selected.category}</div>
            <div className="symbol-detail-desc">{selected.description}</div>
          </div>
        </div>
      )}
    </div>
  );
}
