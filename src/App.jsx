import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ArcGISMap from './components/ArcGISMap';
import {
  OPERATION_CONFIG,
  INCIDENTS_SWORD_STAGED,
  MISSIONS_SWORD_STAGED,
  INCIDENT_COLORS,
} from './data';

const UNIT_MOVE_SPEED  = 0.004;
const UNIT_RANDOM_STEP = 0.003;
const ARRIVE_DIST = 0.003;
const ARRIVAL_MSG_DELAY = 30000;

function nowTime() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function calcDist(u, inc) {
  const dLat = u.lat - inc.lat;
  const dLng = u.lng - inc.lng;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

function findClosestFreeUnits(incident, units, count) {
  const free = units.filter(u => !u.assignedIncident && u.status !== 'offline');
  return free
    .map(u => ({ unit: u, dist: calcDist(u, incident) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, count)
    .map(x => x.unit);
}

export default function App() {
  const [currentOpId,    setCurrentOpId]    = useState('norwegian-sword');
  const [units,          setUnits]          = useState([]);
  const [incidents,      setIncidents]      = useState([]);
  const [missions,       setMissions]       = useState([]);
  const [chatHistory,    setChatHistory]    = useState([]);
  const [stats,          setStats]          = useState({ units: 0, incidents: 0, tasks: 0, alerts: 0 });
  const [missionStartTime, setMissionStartTime] = useState(null);
  const [basemap,        setBasemap]        = useState('dark');
  const [mapCenter,      setMapCenter]      = useState([10.741, 59.913]);
  const [mapZoom,        setMapZoom]        = useState(12);
  const [mapCoords,      setMapCoords]      = useState(null);
  const [currentZoom,    setCurrentZoom]    = useState(12);
  const [unreadChat,     setUnreadChat]     = useState(0);
  const [unreadIncidents, setUnreadIncidents] = useState(0);
  const [broadcastOpen,  setBroadcastOpen]  = useState(false);
  const [broadcastText,  setBroadcastText]  = useState('');
  const [activeTab,      setActiveTab]      = useState('overview');
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [unitsVisible,   setUnitsVisible]   = useState(true);
  const [incidentsVisible, setIncidentsVisible] = useState(true);
  const [missionsVisible, setMissionsVisible] = useState(true);
  const [scenarioEnded,  setScenarioEnded]  = useState(false);
  const [isPlaying,      setIsPlaying]      = useState(true);
  const [playbackSpeed,  setPlaybackSpeed]  = useState(1);
  const [scenarioProgress, setScenarioProgress] = useState(0);
  const SCENARIO_TOTAL_MS = 205000; // 140s last incident + ~65s for arrival msgs + bank chat

  const simTimers    = useRef([]);
  const moveInterval = useRef(null);
  const progressInterval = useRef(null);
  const simStartRef  = useRef(null);
  const viewRef      = useRef(null);
  const unitsRef     = useRef([]);
  const incidentsRef = useRef([]);
  const missionsRef  = useRef([]);
  const chatIdRef    = useRef(100);
  const activeTabRef = useRef('overview');
  const arrivedRef   = useRef(new Set());
  const isPlayingRef = useRef(true);
  const playbackSpeedRef = useRef(1);

  const loadOperation = useCallback((opId) => {
    simTimers.current.forEach(clearTimeout);
    simTimers.current = [];
    if (moveInterval.current) clearInterval(moveInterval.current);
    if (progressInterval.current) clearInterval(progressInterval.current);

    const op = OPERATION_CONFIG[opId];

    const freshUnits = op.units.map(u => ({
      ...u,
      target:           null,
      assignedIncident: null,
      incidentColorIndex: null,
      signal:           u.signal ?? 4,
    }));
    unitsRef.current = freshUnits;
    setUnits([...freshUnits]);

    const freshIncidents = op.staged ? [] : op.incidents.map(i => ({ ...i }));
    incidentsRef.current = freshIncidents;
    setIncidents([...freshIncidents]);

    missionsRef.current = [];
    setMissions([]);
    arrivedRef.current = new Set();

    const freshChat = op.chat.map((m, i) => ({ ...m, id: i }));
    chatIdRef.current = freshChat.length + 1;
    setChatHistory([...freshChat]);

    setStats({ ...op.stats });
    setCurrentOpId(opId);
    setMapCenter([...op.center]);
    setMapZoom(op.zoom);
    setScenarioEnded(false);
    setScenarioProgress(0);
    setIsPlaying(true);
    isPlayingRef.current = true;
    playbackSpeedRef.current = 1;
    setPlaybackSpeed(1);

    const startTime = Date.now() - (op.elapsed || 0);
    setMissionStartTime(startTime);
    simStartRef.current = Date.now();

    if (op.staged) {
      startStagedSimulation(freshUnits, freshIncidents);
    }

    // Progress tracking interval
    if (op.staged) {
      progressInterval.current = setInterval(() => {
        if (!simStartRef.current || !isPlayingRef.current) return;
        const elapsed = Date.now() - simStartRef.current;
        const pct = Math.min(100, Math.round((elapsed / SCENARIO_TOTAL_MS) * 100));
        setScenarioProgress(pct);
        if (pct >= 100) clearInterval(progressInterval.current);
      }, 500);
    }

    moveInterval.current = setInterval(() => {
      tickMovement();
    }, 3000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startStagedSimulation(initialUnits, initialIncidents) {
    INCIDENTS_SWORD_STAGED.forEach((incData) => {
      const t = setTimeout(() => {
        if (unitsRef.current.length === 0) return;

        const now = nowTime();
        const inc = {
          id:        incData.id,
          title:     incData.title,
          desc:      incData.desc,
          priority:  incData.priority,
          time:      now,
          icon:      incData.icon,
          lat:       incData.lat,
          lng:       incData.lng,
          colorIndex: incData.colorIndex,
        };

        incidentsRef.current = [...incidentsRef.current, inc];
        setIncidents([...incidentsRef.current]);

        if (activeTabRef.current !== 'incidents') {
          setUnreadIncidents(n => n + 1);
        }

        setStats(prev => ({
          ...prev,
          incidents: incidentsRef.current.length,
        }));

        let assignedUnitIds = [];

        if (incData.assignAll) {
          // Bank robbery: bring P3 and U1 online first
          unitsRef.current = unitsRef.current.map(u => {
            if (u.id === 'P3' || u.id === 'U1') {
              return { ...u, status: 'ledig' };
            }
            return u;
          });

          // All non-offline units to bank
          unitsRef.current = unitsRef.current.map(u => ({
            ...u,
            target: { lat: incData.lat, lng: incData.lng },
            moving: u.status !== 'offline',
            assignedIncident: u.status !== 'offline' ? incData.id : u.assignedIncident,
            incidentColorIndex: incData.colorIndex,
            status: u.status === 'offline' ? 'offline' : 'opptatt',
          }));
          assignedUnitIds = unitsRef.current.filter(u => u.status !== 'offline').map(u => u.id);
        } else {
          const toAssign = findClosestFreeUnits(inc, unitsRef.current, 2);
          const assignIds = new Set(toAssign.map(u => u.id));
          assignedUnitIds = [...assignIds];

          unitsRef.current = unitsRef.current.map(u => {
            if (assignIds.has(u.id)) {
              return {
                ...u,
                target: { lat: incData.lat, lng: incData.lng },
                moving: true,
                assignedIncident: incData.id,
                incidentColorIndex: incData.colorIndex,
                status: 'opptatt',
              };
            }
            return u;
          });

          const dispatched = toAssign.map(u => u.name).join(' og ');
          addSystemChat(
            `🚨 Ny hendelse: ${incData.title} — ${incData.desc}`,
            '#e74c3c'
          );
          setTimeout(() => {
            addSystemChat(
              `🚓 ${dispatched} utsendt til ${incData.title}`,
              '#f39c12'
            );
          }, 2000);
        }

        setUnits([...unitsRef.current]);

        // Create missions for this incident
        const incMissions = MISSIONS_SWORD_STAGED.filter(m => m.incidentId === incData.id);
        const newMissions = incMissions.map((m, idx) => {
          let missionUnits = [];
          if (incData.assignAll) {
            missionUnits = assignedUnitIds.filter((_, i) => i % incMissions.length === idx);
          } else {
            missionUnits = [assignedUnitIds[idx % assignedUnitIds.length]].filter(Boolean);
          }
          return { ...m, assignedUnitIds: missionUnits };
        });

        missionsRef.current = [...missionsRef.current, ...newMissions];
        setMissions([...missionsRef.current]);

        // Incident-specific chat messages
        incData.chatMessages.forEach((msg, msgIdx) => {
          setTimeout(() => {
            addChat({ ...msg, time: nowTime() });
          }, 3000 + msgIdx * 4000);
        });

        // Arrival messages
        const arrivalDelay = incData.assignAll ? 20000 : ARRIVAL_MSG_DELAY;
        incData.arrivalMessages.forEach((msg, msgIdx) => {
          setTimeout(() => {
            addChat({ ...msg, time: nowTime() });
          }, arrivalDelay + msgIdx * 5000);
        });

        // Scenario end: after bank robbery arrival messages + 30s
        if (incData.assignAll) {
          const scenarioEndDelay = arrivalDelay
            + incData.arrivalMessages.length * 5000
            + 30000;
          setTimeout(() => {
            setScenarioEnded(true);
          }, scenarioEndDelay);
        }
      }, incData.delay);

      simTimers.current.push(t);
    });
  }

  function tickMovement() {
    let changed = false;
    const updated = unitsRef.current.map(unit => {
      if (unit.status === 'offline') return unit;
      if (unit.target) {
        const dLat = unit.target.lat - unit.lat;
        const dLng = unit.target.lng - unit.lng;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        if (dist > ARRIVE_DIST) {
          changed = true;
          return {
            ...unit,
            lat: unit.lat + (dLat / dist) * UNIT_MOVE_SPEED,
            lng: unit.lng + (dLng / dist) * UNIT_MOVE_SPEED,
            moving: true,
          };
        } else {
          // Unit arrived
          if (!arrivedRef.current.has(unit.id)) {
            arrivedRef.current.add(unit.id);
            checkMissionCompletion(unit.id);
          }
          changed = true;
          return { ...unit, moving: false, target: null };
        }
      } else if (unit.moving) {
        changed = true;
        return {
          ...unit,
          lat: unit.lat + (Math.random() - 0.5) * UNIT_RANDOM_STEP,
          lng: unit.lng + (Math.random() - 0.5) * UNIT_RANDOM_STEP,
        };
      }
      return unit;
    });

    if (changed) {
      unitsRef.current = updated;
      setUnits([...updated]);
    }
  }

  function checkMissionCompletion(arrivedUnitId) {
    let anyUpdated = false;
    const updatedMissions = missionsRef.current.map(m => {
      if (m.status === 'completed') return m;
      if (!m.assignedUnitIds || !m.assignedUnitIds.includes(arrivedUnitId)) return m;
      const allArrived = m.assignedUnitIds.every(uid => arrivedRef.current.has(uid));
      if (allArrived) {
        anyUpdated = true;
        return { ...m, status: 'completed' };
      }
      return m;
    });
    if (anyUpdated) {
      missionsRef.current = updatedMissions;
      setMissions([...updatedMissions]);
    }
  }

  function addSystemChat(text, color = '#6b7280') {
    addChat({ sender: 'System', initials: '⚙', color, system: true, text });
  }

  function addChat(msgData) {
    const id = chatIdRef.current++;
    const msg = { ...msgData, id, time: msgData.time || nowTime(), self: msgData.self || false };
    setChatHistory(prev => [...prev, msg]);
    if (activeTabRef.current !== 'chat') {
      setUnreadChat(n => n + 1);
    }
  }

  useEffect(() => {
    loadOperation('norwegian-sword');
    return () => {
      simTimers.current.forEach(clearTimeout);
      if (moveInterval.current) clearInterval(moveInterval.current);
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlayPause = useCallback(() => {
    const nowPlaying = !isPlayingRef.current;
    isPlayingRef.current = nowPlaying;
    setIsPlaying(nowPlaying);
    if (nowPlaying) {
      // Resume movement
      if (!moveInterval.current) {
        moveInterval.current = setInterval(() => { tickMovement(); }, 3000);
      }
    } else {
      // Pause movement
      if (moveInterval.current) {
        clearInterval(moveInterval.current);
        moveInterval.current = null;
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSpeedChange = useCallback((speed) => {
    playbackSpeedRef.current = speed;
    setPlaybackSpeed(speed);
    // Adjust movement interval speed
    if (moveInterval.current) {
      clearInterval(moveInterval.current);
      moveInterval.current = setInterval(() => { tickMovement(); }, Math.max(500, 3000 / speed));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOperationChange = useCallback((opId) => {
    loadOperation(opId);
  }, [loadOperation]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    activeTabRef.current = tab;
    if (tab === 'chat')      setUnreadChat(0);
    if (tab === 'incidents') setUnreadIncidents(0);
  }, []);

  const handleUnitClick = useCallback((unit) => {
    setMapCenter([unit.lng, unit.lat]);
    setMapZoom(14);
  }, []);

  const handleIncidentClick = useCallback((inc) => {
    setMapCenter([inc.lng, inc.lat]);
    setMapZoom(14);
  }, []);

  const handleSendMessage = useCallback((text) => {
    addChat({ sender: 'Deg', initials: 'AU', color: '#0078d4', self: true, text });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBroadcast = useCallback(() => setBroadcastOpen(true), []);

  const sendBroadcast = () => {
    if (!broadcastText.trim()) return;
    addChat({
      sender: 'Deg (Kringkast)', initials: 'AU', color: '#0078d4',
      text: `📢 KRINGKAST: ${broadcastText.trim()}`,
    });
    setBroadcastText('');
    setBroadcastOpen(false);
    setActiveTab('chat');
  };

  const toggleBasemap = useCallback(() => {
    setBasemap(b => b === 'dark' ? 'light' : 'dark');
  }, []);

  const opConfig = OPERATION_CONFIG[currentOpId];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header
        currentOpId={currentOpId}
        onOperationChange={handleOperationChange}
        onBroadcast={handleBroadcast}
        scenarioEnded={scenarioEnded}
      />

      <div className="main-layout">
        <Sidebar
          opConfig={opConfig}
          units={units}
          incidents={incidents}
          missions={missions}
          chatHistory={chatHistory}
          stats={stats}
          missionStartTime={missionStartTime}
          onUnitClick={handleUnitClick}
          onIncidentClick={handleIncidentClick}
          onSendMessage={handleSendMessage}
          unreadChat={unreadChat}
          unreadIncidents={unreadIncidents}
          onTabChange={handleTabChange}
        />

        {/* Map area */}
        <div className="map-area">
          <ArcGISMap
            center={mapCenter}
            zoom={mapZoom}
            basemap={basemap}
            units={unitsVisible ? units : []}
            incidents={incidentsVisible ? incidents : []}
            missions={missionsVisible ? missions : []}
            aoCoords={opConfig.aoCoords}
            aoLabel={opConfig.aoLabel}
            onCoordMove={(lat, lng) => setMapCoords({ lat, lng })}
            onZoomChange={setCurrentZoom}
          />

          {/* Toolbar */}
          <div className="map-toolbar">
            <button
              className={`map-toolbar-btn${unitsVisible ? ' active' : ''}`}
              onClick={() => setUnitsVisible(v => !v)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
              Enheter
            </button>

            <button
              className={`map-toolbar-btn${incidentsVisible ? ' active' : ''}`}
              onClick={() => setIncidentsVisible(v => !v)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              </svg>
              Hendelser
            </button>

            <button
              className={`map-toolbar-btn${layerPanelOpen ? ' active' : ''}`}
              onClick={e => { e.stopPropagation(); setLayerPanelOpen(v => !v); }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                <polyline points="2 17 12 22 22 17"/>
                <polyline points="2 12 12 17 22 12"/>
              </svg>
              Kartlag
            </button>
          </div>

          {/* Layer panel */}
          {layerPanelOpen && (
            <div className="layer-panel visible" onClick={e => e.stopPropagation()}>
              <div className="layer-panel-title">Kartlag</div>
              <label className="layer-item">
                <input type="checkbox" checked={unitsVisible} onChange={e => setUnitsVisible(e.target.checked)} />
                Enhetsposisjoner
              </label>
              <label className="layer-item">
                <input type="checkbox" checked={incidentsVisible} onChange={e => setIncidentsVisible(e.target.checked)} />
                Hendelsesmarkører
              </label>
              <label className="layer-item">
                <input type="checkbox" checked={missionsVisible} onChange={e => setMissionsVisible(e.target.checked)} />
                Oppdrag
              </label>
            </div>
          )}

          {/* Map search */}
          <div className="map-search-bar">
            <svg style={{ paddingLeft: '10px', color: '#6b7280' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Søk sted…" />
          </div>

          {/* Info bar */}
          <div className="map-info-bar">
            <span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              {' '}
              {mapCoords
                ? `${mapCoords.lat.toFixed(4)}°N ${mapCoords.lng.toFixed(4)}°E`
                : 'Hold musepeker over kartet for koordinater'}
            </span>
            <span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              {' '}Zoom: {currentZoom}
            </span>
            <span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              {' '}{units.length} enheter spores
            </span>
            <span style={{ marginLeft: 'auto', color: 'var(--accent-green)' }}>
              ● Kartsynkronisering aktiv
            </span>
          </div>

          {/* Basemap toggle */}
          <button
            className={`basemap-toggle-btn${basemap === 'light' ? ' light-active' : ''}`}
            onClick={toggleBasemap}
            title="Bytt kartbakgrunn"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
            <span>{basemap === 'dark' ? 'Lyst kart' : 'Mørkt kart'}</span>
          </button>

          {/* Time Player */}
          {opConfig.staged && (
            <div className="time-player">
              <button
                className="time-player-btn"
                onClick={handlePlayPause}
                title={isPlaying ? 'Pause' : 'Spill av'}
              >
                {isPlaying ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                )}
              </button>
              <div className="time-player-speeds">
                {[1, 2, 4].map(s => (
                  <button
                    key={s}
                    className={`time-player-speed-btn${playbackSpeed === s ? ' active' : ''}`}
                    onClick={() => handleSpeedChange(s)}
                  >
                    {s}x
                  </button>
                ))}
              </div>
              <div className="time-player-progress-wrap">
                <div className="time-player-progress-bar">
                  <div
                    className="time-player-progress-fill"
                    style={{ width: `${scenarioProgress}%`, background: scenarioEnded ? '#e74c3c' : '#0078d4' }}
                  />
                </div>
                <span className="time-player-pct">
                  {scenarioEnded ? '✓ Ferdig' : `${scenarioProgress}%`}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Broadcast modal */}
      {broadcastOpen && (
        <div className="modal-backdrop" onClick={() => setBroadcastOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">📡 Send kringkastmelding</h3>
            <textarea
              className="modal-textarea"
              placeholder="Skriv din kringkastmelding…"
              value={broadcastText}
              onChange={e => setBroadcastText(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button className="header-btn" onClick={() => setBroadcastOpen(false)}>Avbryt</button>
              <button className="header-btn primary" onClick={sendBroadcast}>Send til alle enheter</button>
            </div>
          </div>
        </div>
      )}

      {layerPanelOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 5 }}
          onClick={() => setLayerPanelOpen(false)}
        />
      )}
    </div>
  );
}
