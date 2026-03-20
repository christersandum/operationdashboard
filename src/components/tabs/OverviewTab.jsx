import React, { useState, useEffect } from 'react';

export default function OverviewTab({ opConfig, stats, missionStartTime }) {
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
            <span>Oppdragsframgang</span>
            <span>{opConfig.progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: opConfig.progress + '%' }} />
          </div>
        </div>
      </div>

      {/* Mission info */}
      <div className="overview-section">
        <div className="overview-title">Oppdragsinfo</div>
        <div className="mission-info-row">
          <span className="info-label">Kommandant</span>
          <span className="info-value">{opConfig.commander}</span>
        </div>
        <div className="mission-info-row">
          <span className="info-label">Status</span>
          <span className="info-value active">AKTIV</span>
        </div>
        <div className="mission-info-row">
          <span className="info-label">Starttid</span>
          <span className="info-value">{startStr}</span>
        </div>
        <div className="mission-info-row">
          <span className="info-label">Varighet</span>
          <span className="info-value">{duration}</span>
        </div>
        <div className="mission-info-row">
          <span className="info-label">AO Senter</span>
          <span className="info-value">{opConfig.aoCenter}</span>
        </div>
        <div className="mission-info-row">
          <span className="info-label">Samband</span>
          <span className="info-value active">Kryptert</span>
        </div>
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
