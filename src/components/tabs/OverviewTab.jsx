import React, { useState, useEffect } from 'react';

export default function OverviewTab({ opConfig, stats, missionStartTime, units }) {
  const [duration, setDuration] = useState('--');

  useEffect(() => {
    const update = () => {
      if (!missionStartTime) { setDuration('--'); return; }
      const elapsed = Date.now() - missionStartTime;
      const h = Math.floor(elapsed / 3600000);
      const m = Math.floor((elapsed % 3600000) / 60000);
      setDuration(`${h}t ${m}m`);
    };
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [missionStartTime]);

  const startStr = missionStartTime
    ? new Date(missionStartTime).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' }) + ' UTC'
    : '--';

  // Compute resource rate: % of non-offline units that are free (not assigned)
  const nonOffline = (units || []).filter(u => u.status !== 'offline');
  const freeUnits = nonOffline.filter(u => !u.assignedIncident);
  const resourceRate = nonOffline.length > 0
    ? Math.round((freeUnits.length / nonOffline.length) * 100)
    : 0;

  const intelCases = [
    {
      title: 'Etterretning: Kriminell gjeng observert',
      desc: 'Flere rapporter indikerer at en organisert kriminell gjeng er aktiv i Oslo-sentrum. Gjengmedlemmer er sett ved Grønland, Majorstua og Skøyen de siste 48 timene.',
      icon: '🔍',
      iconBg: 'rgba(155,89,182,0.15)',
      iconColor: '#9b59b6',
    },
    {
      title: 'Etterretning: Koordinerte aksjoner',
      desc: 'Gjengaktiviteten viser et koordinert mønster med distraksjonshandlinger (brann, blokkering) som forløpere til større kriminelle handlinger.',
      icon: '⚠',
      iconBg: 'rgba(243,156,18,0.15)',
      iconColor: '#f39c12',
    },
    {
      title: 'Etterretning: Bankran planlagt',
      desc: 'Kilde melder om konkrete planer om væpnet ran av bank i Oslo-sentrum. Tidspunkt uavklart. Alle enheter beredskap.',
      icon: '🏦',
      iconBg: 'rgba(231,76,60,0.15)',
      iconColor: '#e74c3c',
    },
  ];

  return (
    <div className="scrollable">
      {/* Stats */}
      <div className="overview-section">
        <div className="overview-title">Oppdragsstatus</div>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-value green">{stats.units}</div>
            <div className="stat-label">Aktive Enheter</div>
          </div>
          <div className="stat-card">
            <div className="stat-value red">{stats.incidents}</div>
            <div className="stat-label">Hendelser</div>
          </div>
          <div className="stat-card">
            <div className="stat-value blue">{stats.tasks}</div>
            <div className="stat-label">Åpne Oppgaver</div>
          </div>
          <div className="stat-card">
            <div className="stat-value orange">{stats.alerts}</div>
            <div className="stat-label">Varsler</div>
          </div>
        </div>
        <div className="progress-bar-wrap" style={{ marginTop: '12px' }}>
          <div className="progress-label">
            <span>Ressursgrad</span>
            <span>{resourceRate}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: resourceRate + '%' }} />
          </div>
        </div>
      </div>

      {/* Intel cases */}
      <div className="overview-section">
        <div className="overview-title">Varsler</div>
        {intelCases.map((c, i) => (
          <div key={i} className="intel-case-item">
            <div className="alert-icon" style={{ background: c.iconBg, color: c.iconColor }}>
              {c.icon}
            </div>
            <div className="alert-body">
              <div className="alert-text" style={{ fontWeight: 600, marginBottom: '4px' }}>{c.title}</div>
              <div className="alert-time" style={{ fontSize: '11px', lineHeight: '1.4', color: 'var(--text-secondary)' }}>{c.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div className="overview-section" style={{ padding: 0 }}>
        <div className="section-header">
          <span className="section-title">Siste Varsler</span>
          <span className="section-count">{opConfig.alerts.length} nye</span>
        </div>
        {opConfig.alerts.map((a, i) => (
          <div key={i} className="alert-item">
            <div className="alert-icon" style={{ background: a.iconBg, color: a.iconColor }}>
              {a.icon}
            </div>
            <div className="alert-body">
              <div className="alert-text">{a.text}</div>
              <div className="alert-time">{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
