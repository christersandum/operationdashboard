import React, { useState } from 'react';
import {
  CalciteDialog,
  CalciteButton,
  CalciteList,
  CalciteListItem,
  CalciteLabel,
} from '@esri/calcite-components-react';

export default function WebMapPicker({
  open,
  webmaps,
  loading,
  onSelect,
  onSkip,
  onClose,
}) {
  const [selectedId, setSelectedId] = useState(null);

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId);
    }
  };

  return (
    <CalciteDialog
      open={open || undefined}
      heading="Velg webkart"
      onCalciteDialogClose={onClose}
    >
      <p style={{ color: 'var(--calcite-color-text-2)', fontSize: '13px', marginBottom: '12px' }}>
        Velg et webkart fra ArcGIS Online. Kartets bakgrunnskart og lag lastes automatisk.
        Operasjonsdataene (enheter, hendelser, oppdrag) legges oppå det valgte kartet.
      </p>

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--calcite-color-text-2)' }}>
          Laster webkart…
        </div>
      ) : webmaps.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--calcite-color-text-2)', fontSize: '13px' }}>
          Ingen webkart funnet i portalen. Fortsetter med standard kartbakgrunn.
        </div>
      ) : (
        <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
          {webmaps.map(wm => (
            <div
              key={wm.id}
              onClick={() => setSelectedId(wm.id)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                borderRadius: '4px',
                marginBottom: '4px',
                border: `1px solid ${selectedId === wm.id ? 'var(--calcite-color-brand)' : 'var(--calcite-color-border-1)'}`,
                background: selectedId === wm.id ? 'rgba(0,120,212,0.12)' : 'var(--calcite-color-foreground-1)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              {wm.thumbnailUrl ? (
                <img
                  src={wm.thumbnailUrl}
                  alt={wm.title}
                  style={{ width: '60px', height: '45px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div style={{
                  width: '60px', height: '45px', borderRadius: '3px', flexShrink: 0,
                  background: 'var(--calcite-color-foreground-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  🗺
                </div>
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--calcite-color-text-1)' }}>{wm.title}</div>
                {wm.snippet && (
                  <div style={{ fontSize: '11px', color: 'var(--calcite-color-text-2)', marginTop: '2px' }}>{wm.snippet}</div>
                )}
                <div style={{ fontSize: '10px', color: 'var(--calcite-color-text-3)', marginTop: '2px' }}>ID: {wm.id}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CalciteButton
        slot="footer-end"
        disabled={!selectedId || undefined}
        onClick={handleConfirm}
      >
        Bruk valgt webkart
      </CalciteButton>
      <CalciteButton
        slot="footer-start"
        kind="neutral"
        appearance="outline"
        onClick={onSkip}
      >
        Hopp over — bruk standard kart
      </CalciteButton>
    </CalciteDialog>
  );
}
