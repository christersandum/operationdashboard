import React, { useState } from 'react';
import {
  CalciteShellPanel,
  CalciteActionBar,
  CalciteAction,
  CalcitePanel,
  CalciteActionGroup,
} from '@esri/calcite-components-react';
import OverviewTab    from './tabs/OverviewTab';
import UnitsTab       from './tabs/UnitsTab';
import IncidentsTab   from './tabs/IncidentsTab';
import MissionsTab    from './tabs/MissionsTab';
import ChatTab        from './tabs/ChatTab';
import SymbolLibraryTab from './tabs/SymbolLibraryTab';
import './Sidebar.css';

const TAB_DEFS = [
  { id: 'overview',      label: 'Oversikt',  icon: 'grid'                      },
  { id: 'participants',  label: 'Enheter',   icon: 'person'                    },
  { id: 'incidents',     label: 'Hendelser', icon: 'exclamation-mark-triangle' },
  { id: 'missions',      label: 'Oppdrag',   icon: 'check-square'              },
  { id: 'chat',          label: 'Chat',      icon: 'speech-bubble'             },
  { id: 'symbols',       label: 'Symboler',  icon: 'pins'                      },
];

const PANEL_HEADINGS = {
  overview:     'Oversikt',
  participants: 'Feltenheter',
  incidents:    'Hendelser',
  missions:     'Oppdrag',
  chat:         'Operasjonslogg',
  symbols:      'Symbolbibliotek',
};

export default function Sidebar({
  opConfig, units, incidents, missions, chatHistory, stats, missionStartTime,
  onUnitClick, onIncidentClick, onSendMessage, unreadChat, unreadIncidents,
  onTabChange, onMissionClick, width,
}) {
  const [activeTab, setActiveTab] = useState('overview');

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  return (
    <CalciteShellPanel
      slot="panel-start"
      displayMode="dock"
      style={{ '--calcite-shell-panel-width': width ? `${width}px` : '310px' }}
    >
      <CalciteActionBar slot="action-bar" expanded={false}>
        <CalciteActionGroup>
          {TAB_DEFS.map(t => (
            <CalciteAction
              key={t.id}
              icon={t.icon}
              text={t.label}
              active={activeTab === t.id || undefined}
              indicator={
                (t.id === 'chat' && unreadChat > 0) ||
                (t.id === 'incidents' && unreadIncidents > 0) ||
                undefined
              }
              onClick={() => switchTab(t.id)}
            />
          ))}
        </CalciteActionGroup>
      </CalciteActionBar>

      <CalcitePanel heading={PANEL_HEADINGS[activeTab]} style={{ height: '100%' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <OverviewTab opConfig={opConfig} stats={stats} missionStartTime={missionStartTime} units={units} />
          </div>
        )}
        {activeTab === 'participants' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <UnitsTab units={units} incidents={incidents} onUnitClick={onUnitClick} />
          </div>
        )}
        {activeTab === 'incidents' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <IncidentsTab incidents={incidents} units={units} onIncidentClick={onIncidentClick} />
          </div>
        )}
        {activeTab === 'missions' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <MissionsTab missions={missions || []} units={units} incidents={incidents} onMissionClick={onMissionClick} />
          </div>
        )}
        {activeTab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <ChatTab messages={chatHistory} onSend={onSendMessage} units={units} />
          </div>
        )}
        {activeTab === 'symbols' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <SymbolLibraryTab />
          </div>
        )}
      </CalcitePanel>
    </CalciteShellPanel>
  );
}
