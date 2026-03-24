import React, { useState } from 'react';
import OverviewTab from './tabs/OverviewTab';
import UnitsTab from './tabs/UnitsTab';
import IncidentsTab from './tabs/IncidentsTab';
import MissionsTab from './tabs/MissionsTab';
import ChatTab from './tabs/ChatTab';
import SymbolLibraryTab from './tabs/SymbolLibraryTab';

export default function Sidebar({
  opConfig,
  units,
  incidents,
  missions,
  chatHistory,
  stats,
  missionStartTime,
  onUnitClick,
  onIncidentClick,
  onSendMessage,
  unreadChat,
  unreadIncidents,
  onTabChange,
  width,
}) {
  const [activeTab, setActiveTab] = useState('overview');

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const openMissions = (missions || []).filter(m => m.status !== 'completed').length;

  const tabs = [
    { id: 'overview',      label: 'Oversikt',  badge: null },
    { id: 'participants',  label: 'Enheter',   badge: null },
    { id: 'incidents',     label: 'Hendelser', badge: unreadIncidents > 0 ? unreadIncidents : null },
    { id: 'missions',      label: 'Oppdrag',   badge: openMissions > 0 ? openMissions : null },
    { id: 'chat',          label: 'Chat',      badge: unreadChat > 0 ? unreadChat : null },
    { id: 'symbols',       label: 'Symboler',  badge: null },
  ];

  return (
    <aside className="sidebar" style={width ? { width: `${width}px` } : undefined}>
      <nav className="tab-bar">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
            onClick={() => switchTab(t.id)}
          >
            <TabIcon id={t.id} />
            {t.label}
            {t.badge != null && (
              <span className="tab-badge">{t.badge}</span>
            )}
          </button>
        ))}
      </nav>

      <div className={`tab-content${activeTab === 'overview' ? ' active' : ''}`} id="tab-overview">
        <OverviewTab opConfig={opConfig} stats={stats} missionStartTime={missionStartTime} units={units} />
      </div>
      <div className={`tab-content${activeTab === 'participants' ? ' active' : ''}`} id="tab-participants">
        <UnitsTab units={units} incidents={incidents} onUnitClick={onUnitClick} />
      </div>
      <div className={`tab-content${activeTab === 'incidents' ? ' active' : ''}`} id="tab-incidents">
        <IncidentsTab incidents={incidents} units={units} onIncidentClick={onIncidentClick} />
      </div>
      <div className={`tab-content${activeTab === 'missions' ? ' active' : ''}`} id="tab-missions">
        <MissionsTab missions={missions || []} units={units} incidents={incidents} />
      </div>
      <div className={`tab-content${activeTab === 'chat' ? ' active' : ''}`} id="tab-chat">
        <ChatTab messages={chatHistory} onSend={onSendMessage} />
      </div>
      <div className={`tab-content${activeTab === 'symbols' ? ' active' : ''}`} id="tab-symbols">
        <SymbolLibraryTab />
      </div>
    </aside>
  );
}

function TabIcon({ id }) {
  switch (id) {
    case 'overview':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      );
    case 'participants':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      );
    case 'incidents':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      );
    case 'missions':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 11 12 14 22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      );
    case 'chat':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      );
    case 'symbols':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
        </svg>
      );
    default:
      return null;
  }
}
