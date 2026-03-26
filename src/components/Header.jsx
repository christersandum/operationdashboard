import React, { useState, useEffect, useRef } from 'react';
import {
  CalciteNavigation,
  CalciteNavigationLogo,
  CalciteNavigationUser,
  CalciteChip,
  CalciteButton,
  CalciteIcon,
  CalciteDropdown,
  CalciteDropdownGroup,
  CalciteDropdownItem,
  CalciteLabel,
  CalciteInput,
} from '@esri/calcite-components-react';

const TIMEZONES = [
  { id: 'UTC',                 label: 'UTC',        abbr: 'UTC'      },
  { id: 'Europe/Oslo',         label: 'Oslo',       abbr: 'CET/CEST' },
  { id: 'America/New_York',    label: 'New York',   abbr: 'ET'       },
  { id: 'America/Los_Angeles', label: 'Los Angeles',abbr: 'PT'       },
  { id: 'Asia/Tokyo',          label: 'Tokyo',      abbr: 'JST'      },
];

export default function Header({
  currentOpId,
  onOperationChange,
  onBroadcast,
  scenarioEnded,
  onSaveOperation,
  onLoadOperation,
  onNewOperation,
  onDeleteOperation,
  onDrawAO,
  drawAOMode,
  onSettingsChange,
  timingConfig,
}) {
  const pad = n => String(n).padStart(2, '0');
  const [time, setTime]     = useState('--:--:--');
  const [date, setDate]     = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef  = useRef(null);
  const fileInputRef = useRef(null);

  const defaultSettings = {
    firstDelay: 15, interval: 30, travelTime: 35, bankChatDuration: 30, alertInterval: 10,
  };
  const [settings, setSettings] = useState({ ...defaultSettings, ...(timingConfig || {}) });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      try {
        const fmt = new Intl.DateTimeFormat('nb-NO', {
          timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        });
        const parts = fmt.formatToParts(now);
        const h = parts.find(p => p.type === 'hour')?.value   || '00';
        const m = parts.find(p => p.type === 'minute')?.value || '00';
        const s = parts.find(p => p.type === 'second')?.value || '00';
        const tz = TIMEZONES.find(t => t.id === timezone);
        setTime(`${h}:${m}:${s} ${tz?.abbr || timezone}`);
        const dateFmt = new Intl.DateTimeFormat('nb-NO', {
          timeZone: timezone, day: '2-digit', month: 'short',
        });
        setDate(dateFmt.format(now));
      } catch {
        setTime(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} UTC`);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timezone]);

  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const applySettings = () => {
    if (onSettingsChange) onSettingsChange(settings);
    setSettingsOpen(false);
  };

  return (
    <CalciteNavigation slot="header">
      <CalciteNavigationLogo
        slot="logo"
        thumbnail="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 22 22'%3E%3Cpolygon points='11,1 20,6.5 20,15.5 11,21 2,15.5 2,6.5' fill='%230078d4' opacity='0.85'/%3E%3Cpolygon points='11,4 17.5,7.75 17.5,15.25 11,19 4.5,15.25 4.5,7.75' fill='none' stroke='%23fff' stroke-width='1.2'/%3E%3Ccircle cx='11' cy='11' r='3' fill='%23fff'/%3E%3C/svg%3E"
        heading="OPERASJONS DASHBOARD"
        description={scenarioEnded ? 'FERDIG' : 'AKTIV'}
      />

      <div slot="content-start" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'var(--calcite-color-background)',
          border: '1px solid var(--calcite-color-border-1)',
          borderRadius: '4px', padding: '0 8px', height: '32px',
        }}>
          <CalciteIcon icon="star" scale="s" />
          <select
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--calcite-color-text-1)', fontSize: '13px',
              cursor: 'pointer', outline: 'none',
            }}
            value={currentOpId}
            onChange={e => onOperationChange(e.target.value)}
          >
            <option value="nordic-shield">Operation Nordic Shield</option>
            <option value="norwegian-sword">Operasjon Norwegian Sword</option>
          </select>
        </div>

        <CalciteChip
          kind={scenarioEnded ? 'danger' : 'success'}
          scale="s"
          appearance="outline-fill"
        >
          {scenarioEnded ? 'FERDIG' : 'AKTIV'}
        </CalciteChip>
      </div>

      <div slot="content-end" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Clock with timezone dropdown */}
        <CalciteDropdown placement="bottom-end" scale="s">
          <CalciteButton slot="trigger" kind="neutral" appearance="transparent" scale="s" iconStart="clock">
            <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{time}</span>
            <span style={{ fontSize: '10px', marginLeft: '4px', opacity: 0.7 }}>{date}</span>
          </CalciteButton>
          <CalciteDropdownGroup selectionMode="single" groupTitle="Tidssone">
            {TIMEZONES.map(tz => (
              <CalciteDropdownItem
                key={tz.id}
                selected={timezone === tz.id || undefined}
                onCalciteDropdownItemSelect={() => setTimezone(tz.id)}
              >
                {tz.abbr} — {tz.label}
              </CalciteDropdownItem>
            ))}
          </CalciteDropdownGroup>
        </CalciteDropdown>

        {/* Notifications */}
        <CalciteButton kind="neutral" appearance="transparent" scale="s" iconStart="bell" />

        {/* Broadcast */}
        <CalciteButton kind="brand" scale="s" iconStart="antenna-height" onClick={onBroadcast}>
          Kringkast
        </CalciteButton>

        {/* File menu */}
        <CalciteDropdown placement="bottom-end" scale="s">
          <CalciteButton slot="trigger" kind="neutral" appearance="outline" scale="s" iconStart="folder" iconEnd="chevron-down">
            Fil
          </CalciteButton>
          <CalciteDropdownGroup>
            <CalciteDropdownItem iconStart="save" onCalciteDropdownItemSelect={() => onSaveOperation && onSaveOperation()}>
              Lagre operasjon
            </CalciteDropdownItem>
            <CalciteDropdownItem iconStart="folder-open" onCalciteDropdownItemSelect={() => fileInputRef.current?.click()}>
              Last inn operasjon
            </CalciteDropdownItem>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              aria-label="Last inn operasjonsfil"
              style={{ display: 'none' }}
              onChange={(e) => { onLoadOperation && onLoadOperation(e); }}
            />
          </CalciteDropdownGroup>
          <CalciteDropdownGroup>
            <CalciteDropdownItem iconStart="plus" onCalciteDropdownItemSelect={() => onNewOperation && onNewOperation()}>
              Ny operasjon
            </CalciteDropdownItem>
          </CalciteDropdownGroup>
          <CalciteDropdownGroup>
            <CalciteDropdownItem
              iconStart="polygon"
              onCalciteDropdownItemSelect={() => onDrawAO && onDrawAO()}
              selected={drawAOMode || undefined}
            >
              {drawAOMode ? 'Avbryt AO-tegning' : 'Tegn AO'}
            </CalciteDropdownItem>
          </CalciteDropdownGroup>
          {onDeleteOperation && (
            <CalciteDropdownGroup>
              <CalciteDropdownItem
                iconStart="trash"
                onCalciteDropdownItemSelect={() => onDeleteOperation && onDeleteOperation()}
              >
                Slett operasjon
              </CalciteDropdownItem>
            </CalciteDropdownGroup>
          )}
        </CalciteDropdown>

        {/* Settings */}
        <div ref={settingsRef} style={{ position: 'relative' }}>
          <CalciteButton
            kind="neutral"
            appearance="transparent"
            scale="s"
            iconStart="gear"
            onClick={() => setSettingsOpen(v => !v)}
          >
            Innstillinger
          </CalciteButton>
          {settingsOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 999,
              background: 'var(--calcite-color-foreground-1)',
              border: '1px solid var(--calcite-color-border-1)',
              borderRadius: '4px', padding: '16px', minWidth: '280px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '13px', color: 'var(--calcite-color-text-1)' }}>
                ⚙ Innstillinger
              </div>
              {[
                { key: 'firstDelay',       label: 'Forsinkelse før første hendelse (sek)' },
                { key: 'interval',         label: 'Intervall mellom hendelser (sek)' },
                { key: 'travelTime',       label: 'Reisetid for enheter (sek)' },
                { key: 'bankChatDuration', label: 'Bankran chat-varighet (sek)' },
                { key: 'alertInterval',    label: 'Varslingsintervall (sek)' },
              ].map(({ key, label }) => (
                <div key={key} style={{ marginBottom: '8px' }}>
                  <CalciteLabel scale="s">
                    {label}
                    <CalciteInput
                      type="number"
                      scale="s"
                      value={String(settings[key] ?? defaultSettings[key])}
                      min="1"
                      onCalciteInputInput={e => setSettings(s => ({ ...s, [key]: Number(e.target.value) }))}
                    />
                  </CalciteLabel>
                </div>
              ))}
              <CalciteButton
                width="full"
                onClick={applySettings}
                scale="s"
                kind="brand"
                style={{ marginTop: '8px' }}
              >
                Bruk innstillinger
              </CalciteButton>
            </div>
          )}
        </div>
      </div>

      <CalciteNavigationUser
        slot="user"
        fullName="Admin Bruker"
        username="Operasjonskoordinator"
        thumbnail="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%230078d4'/%3E%3Ctext x='16' y='21' text-anchor='middle' fill='white' font-size='14' font-weight='bold'%3EAU%3C/text%3E%3C/svg%3E"
      />
    </CalciteNavigation>
  );
}
