import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import OperationPicker from './components/OperationPicker';
import { CalciteShell, CalciteButton, CalciteDialog, CalciteInput, CalciteLabel } from '@esri/calcite-components-react';
import {
  UNITS_SWORD,
  INCIDENTS_SWORD_STAGED,
  MISSIONS_SWORD_STAGED,
  CHAT_SWORD,
  SEED_CONFIG,
  ALERTS_SWORD,
} from './utils/seedData';
import { formatUTM33, wgs84ToUTM33N } from './utils/coordUtils';
import { createLocalProvider } from './services/localProvider';

const ArcGISMap = lazy(() => import('./components/ArcGISMap'));

// Singleton local provider for offline/local persistence
const localProvider = createLocalProvider();

const UNIT_MOVE_SPEED  = 0.004;
const UNIT_RANDOM_STEP = 0.003;
const ARRIVE_DIST = 0.003;
const ARRIVAL_MSG_DELAY = 30000;
const RIGHT_PANEL_TOGGLE_WIDTH = 28; // px — must match .right-panel-toggle width in CSS

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
  const [currentOpName,  setCurrentOpName]  = useState(SEED_CONFIG.operationName);
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
  const [aoVisible,      setAoVisible]      = useState(true);
  const [scenarioEnded,  setScenarioEnded]  = useState(false);
  const [isPlaying,      setIsPlaying]      = useState(true);
  const [scenarioProgress, setScenarioProgress] = useState(0);
  const SCENARIO_TOTAL_MS = 205000; // 140s last incident + ~65s for arrival msgs + bank chat

  // Configurable timing settings (Feature 4)
  const [timingSettings, setTimingSettings] = useState({
    warningInterval: 30, incidentInterval: 30, unitTravelTime: 35, taskInterval: 20, chatInterval: 15,
  });
  const timingSettingsRef = useRef({
    warningInterval: 30, incidentInterval: 30, unitTravelTime: 35, taskInterval: 20, chatInterval: 15,
  });

  // Mission positions (Feature 5/6/7) — missionId → { lat, lng }
  const missionPositionsRef = useRef({});
  const [missionPositions, setMissionPositions] = useState({});

  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [sidebarWidth,   setSidebarWidth]   = useState(310);
  const [rightPanelWidth, setRightPanelWidth] = useState(368);
  const [drawAOMode, setDrawAOMode] = useState(false);
  const [aoFirstPoint, setAoFirstPoint] = useState(null);
  const [alertInterval, setAlertInterval] = useState(30);
  const [currentAoCoords, setCurrentAoCoords] = useState(null);
  const [newOpDialogOpen, setNewOpDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [basemapSelectorOpen, setBasemapSelectorOpen] = useState(false);
  const [pickingLocation, setPickingLocation] = useState(null); // null | 'unit' | 'incident'
  const [pickedLocation, setPickedLocation] = useState(null);   // { lat, lng, utm }

  // Load / OperationPicker dialog
  const [loadDialogOpen,   setLoadDialogOpen]   = useState(false);

  // New operation name input
  const [newOpName, setNewOpName] = useState('');

  // Resize refs
  const sidebarResizeRef   = useRef(null);
  const rightPanelResizeRef = useRef(null);
  const isResizingSidebar  = useRef(false);
  const isResizingRight    = useRef(false);
  const resizeStartX       = useRef(0);
  const resizeStartWidth   = useRef(0);

  const simTimers    = useRef([]);
  const moveInterval = useRef(null);
  const progressInterval = useRef(null);
  const alertIntervalRef = useRef(null);
  const alertPoolIndexRef = useRef(0);
  const simStartRef  = useRef(null);
  const viewRef      = useRef(null);
  const unitsRef     = useRef([]);
  const incidentsRef = useRef([]);
  const missionsRef  = useRef([]);
  const chatIdRef    = useRef(100);
  const activeTabRef = useRef('overview');
  const arrivedRef   = useRef(new Set());
  const isPlayingRef = useRef(true);
  const alertIntervalSecRef = useRef(30);

  // Norwegian Sword seed config used as fallback when not signed in
  const opConfig = SEED_CONFIG;

  // ── Auto-save operation state to localStorage (debounced 2s) ──
  // Intentionally only triggers on data changes (units/incidents/missions/chat/ao).
  // Config props (currentOpName, mapCenter, etc.) are read at save time from state.
  useEffect(() => {
    if (!currentOpId) return;
    localProvider.autoSave(currentOpId, {
      operationId:   currentOpId,
      operationName: currentOpName,
      center:        mapCenter,
      zoom:          mapZoom,
      aoCoords:      currentAoCoords,
      aoLabel:       opConfig.aoLabel,
      units,
      incidents,
      missions,
      chat:          chatHistory,
    });
  }, [units, incidents, missions, chatHistory, currentAoCoords, currentOpId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Panel resize handlers ──────────────────────────────────
  const handleSidebarResizeStart = useCallback((e) => {
    e.preventDefault();
    isResizingSidebar.current = true;
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = sidebarWidth;

    const onMove = (ev) => {
      if (!isResizingSidebar.current) return;
      const delta = ev.clientX - resizeStartX.current;
      const newWidth = Math.max(200, Math.min(600, resizeStartWidth.current + delta));
      setSidebarWidth(newWidth);
    };
    const onUp = () => {
      isResizingSidebar.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [sidebarWidth]);

  const handleRightPanelResizeStart = useCallback((e) => {
    e.preventDefault();
    isResizingRight.current = true;
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = rightPanelWidth;

    const onMove = (ev) => {
      if (!isResizingRight.current) return;
      const delta = resizeStartX.current - ev.clientX;
      const newWidth = Math.max(250, Math.min(700, resizeStartWidth.current + delta));
      setRightPanelWidth(newWidth);
    };
    const onUp = () => {
      isResizingRight.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [rightPanelWidth]);

  const loadOperation = useCallback(() => {
    simTimers.current.forEach(clearTimeout);
    simTimers.current = [];
    if (moveInterval.current) clearInterval(moveInterval.current);
    if (progressInterval.current) clearInterval(progressInterval.current);

    // Load Norwegian Sword seed data (offline/default mode)
    const freshUnits = UNITS_SWORD.map(u => ({
      ...u,
      target:             null,
      assignedIncident:   null,
      incidentColorIndex: null,
      signal:             u.signal ?? 4,
    }));
    unitsRef.current = freshUnits;
    setUnits([...freshUnits]);

    incidentsRef.current = [];
    setIncidents([]);

    missionsRef.current = [];
    setMissions([]);
    arrivedRef.current = new Set();

    const freshChat = CHAT_SWORD.map((m, i) => ({ ...m, id: i }));
    chatIdRef.current = freshChat.length + 1;
    setChatHistory([...freshChat]);

    setStats({ ...SEED_CONFIG.stats });
    setCurrentOpId('norwegian-sword');
    setMapCenter([...SEED_CONFIG.center]);
    setMapZoom(SEED_CONFIG.zoom);
    setScenarioEnded(false);
    setScenarioProgress(0);
    setIsPlaying(true);
    isPlayingRef.current = true;

    // Reset mission positions (Feature 5)
    missionPositionsRef.current = {};
    setMissionPositions({});

    const startTime = Date.now() - (SEED_CONFIG.elapsed || 0);
    setMissionStartTime(startTime);
    simStartRef.current = Date.now();

    startStagedSimulation(freshUnits, []);

    // Progress tracking interval
    progressInterval.current = setInterval(() => {
      if (!simStartRef.current || !isPlayingRef.current) return;
      const elapsed = Date.now() - simStartRef.current;
      const pct = Math.min(100, Math.round((elapsed / SCENARIO_TOTAL_MS) * 100));
      setScenarioProgress(pct);
      if (pct >= 100) clearInterval(progressInterval.current);
    }, 500);

    moveInterval.current = setInterval(() => {
      tickMovement();
    }, 3000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startStagedSimulation(initialUnits, initialIncidents) {
    // Helper: compute a random position within ~50m of an incident (Feature 5)
    // 0.00045 degrees ≈ 50 meters at Oslo's latitude (~60°N)
    const FIFTY_METERS_DEG = 0.00045;
    function randomMissionPos(inc) {
      const angle = Math.random() * 2 * Math.PI;
      const r = Math.random() * FIFTY_METERS_DEG;
      const lat = inc.lat + r * Math.sin(angle);
      const lng = inc.lng + r * Math.cos(angle) / Math.cos(inc.lat * Math.PI / 180);
      return { lat, lng };
    }

    INCIDENTS_SWORD_STAGED.forEach((incData, incIdx) => {
      // Use configurable incidentInterval (Feature 4); fall back to seed delay
      const delay = timingSettingsRef.current.incidentInterval > 0
        ? (incIdx + 1) * timingSettingsRef.current.incidentInterval * 1000
        : incData.delay;

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

        // Create missions for this incident and compute random positions (Feature 5)
        const incMissions = MISSIONS_SWORD_STAGED.filter(m => m.incidentId === incData.id);
        const newPositions = {};
        incMissions.forEach(m => {
          if (!missionPositionsRef.current[m.id]) {
            const pos = randomMissionPos(incData);
            newPositions[m.id] = pos;
            missionPositionsRef.current[m.id] = pos;
          }
        });
        if (Object.keys(newPositions).length > 0) {
          setMissionPositions(prev => ({ ...prev, ...newPositions }));
        }

        let assignedUnitIds = [];

        if (incData.assignAll) {
          // Bank robbery: bring P3 and U1 online first
          unitsRef.current = unitsRef.current.map(u => {
            if (u.id === 'P3' || u.id === 'U1') {
              return { ...u, status: 'ledig' };
            }
            return u;
          });

          // All non-offline units assigned to bank missions
          assignedUnitIds = unitsRef.current.filter(u => u.status !== 'offline').map(u => u.id);

          // Assign each unit to its mission's random position (Feature 7)
          const missionList = incMissions.map((m, idx) => ({
            ...m,
            assignedUnitIds: assignedUnitIds.filter((_, i) => i % incMissions.length === idx),
          }));
          unitsRef.current = unitsRef.current.map(u => {
            if (u.status === 'offline') return u;
            // Find which mission this unit belongs to
            const mission = missionList.find(m => m.assignedUnitIds.includes(u.id));
            const mPos = mission
              ? (missionPositionsRef.current[mission.id] || { lat: incData.lat, lng: incData.lng })
              : { lat: incData.lat, lng: incData.lng };
            return {
              ...u,
              target: mPos,
              moving: true,
              assignedIncident: incData.id,
              incidentColorIndex: incData.colorIndex,
              status: 'opptatt',
            };
          });
        } else {
          const toAssign = findClosestFreeUnits(inc, unitsRef.current, 2);
          const assignIds = new Set(toAssign.map(u => u.id));
          assignedUnitIds = [...assignIds];

          // Assign each unit to its mission's random position (Feature 7)
          let assignIdx = 0;
          unitsRef.current = unitsRef.current.map(u => {
            if (assignIds.has(u.id)) {
              const missionForUnit = incMissions[assignIdx % incMissions.length];
              assignIdx++;
              const mPos = missionForUnit
                ? (missionPositionsRef.current[missionForUnit.id] || { lat: incData.lat, lng: incData.lng })
                : { lat: incData.lat, lng: incData.lng };
              return {
                ...u,
                target: mPos,
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

        // Store missions with assigned unit IDs
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
        const chatIntv = timingSettingsRef.current.chatInterval * 1000 || 4000;
        incData.chatMessages.forEach((msg, msgIdx) => {
          setTimeout(() => {
            addChat({ ...msg, time: nowTime() });
          }, chatIntv + msgIdx * chatIntv);
        });

        // Arrival messages
        const travelMs = timingSettingsRef.current.unitTravelTime * 1000 || ARRIVAL_MSG_DELAY;
        const arrivalDelay = incData.assignAll ? Math.min(20000, travelMs) : travelMs;
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
      }, delay);

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

  function startAlertSequence() {
    ALERTS_SWORD.forEach((alert, idx) => {
      const t = setTimeout(() => {
        if (!isPlayingRef.current) return;
        setStats(prev => ({ ...prev, alerts: prev.alerts + 1 }));
        addChat({
          sender: 'System',
          initials: '⚙',
          color: alert.icon_color || '#f39c12',
          system: true,
          text: `${alert.icon} ${alert.text}`,
        });
      }, (idx + 1) * 5000);
      simTimers.current.push(t);
    });
  }

  useEffect(() => {
    loadOperation();
    startAlertSequence();

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

  const handleOperationChange = useCallback(() => {
    loadOperation();
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

  // Feature 6: Click task in panel → zoom to task on map
  const handleMissionClick = useCallback((mission) => {
    const pos = missionPositionsRef.current[mission.id];
    if (pos) {
      setMapCenter([pos.lng, pos.lat]);
      setMapZoom(17);
    } else {
      // Fall back to incident position
      const inc = incidentsRef.current.find(i => i.id === mission.incidentId);
      if (inc) {
        setMapCenter([inc.lng, inc.lat]);
        setMapZoom(15);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendMessage = useCallback((text, recipients) => {
    addChat({
      sender: 'Deg', initials: 'AU', color: '#0078d4', self: true, text,
      recipients: recipients || null,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClearChat = useCallback(() => {
    chatIdRef.current = 2;
    setChatHistory([{
      id: 1, sender: 'System', initials: '⚙', color: '#6b7280',
      system: true, self: false, time: nowTime(),
      text: '🗑 Chat tømt av operatør.',
    }]);
    setUnreadChat(0);
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

  const handleAddUnit = useCallback((unitData) => {
    const newUnit = { ...unitData, target: null, assignedIncident: null, incidentColorIndex: null, signal: 4 };
    unitsRef.current = [...unitsRef.current, newUnit];
    setUnits([...unitsRef.current]);
    setStats(prev => ({ ...prev, units: unitsRef.current.length }));
  }, []);

  const handleEditUnit = useCallback((unitId, changes) => {
    unitsRef.current = unitsRef.current.map(u => u.id === unitId ? { ...u, ...changes } : u);
    setUnits([...unitsRef.current]);
    // Note: single-field update is complex without knowing OBJECTID — full re-sync happens on Save
  }, []);

  const handleDeleteUnit = useCallback((unitId) => {
    unitsRef.current = unitsRef.current.filter(u => u.id !== unitId);
    setUnits([...unitsRef.current]);
    setStats(prev => ({ ...prev, units: unitsRef.current.length }));
  }, []);

  const handleAddIncident = useCallback((incData) => {
    const newInc = { ...incData, time: nowTime(), colorIndex: incidentsRef.current.length % 4 };
    incidentsRef.current = [...incidentsRef.current, newInc];
    setIncidents([...incidentsRef.current]);
    setStats(prev => ({ ...prev, incidents: incidentsRef.current.length }));
  }, []);

  const handleEditIncident = useCallback((incId, changes) => {
    incidentsRef.current = incidentsRef.current.map(i => i.id === incId ? { ...i, ...changes } : i);
    setIncidents([...incidentsRef.current]);
  }, []);

  const handleDeleteIncident = useCallback((incId) => {
    incidentsRef.current = incidentsRef.current.filter(i => i.id !== incId);
    setIncidents([...incidentsRef.current]);
    setStats(prev => ({ ...prev, incidents: incidentsRef.current.length }));
  }, []);

  // Shared helper: dispatch a set of unit IDs to a mission's position (Feature 7)
  // missionPos: { lat, lng } — the mission's map position (random 50m offset)
  function dispatchUnitsToMission(unitIds, mission, inc) {
    const mPos = missionPositionsRef.current[mission.id] || { lat: inc.lat, lng: inc.lng };
    unitsRef.current = unitsRef.current.map(u => {
      if (unitIds.includes(u.id)) {
        return { ...u, target: mPos, moving: true, assignedIncident: inc.id, status: 'opptatt', incidentColorIndex: inc.colorIndex ?? 0 };
      }
      return u;
    });
    setUnits([...unitsRef.current]);
  }

  const handleAddMission = useCallback((missionData) => {
    const newMission = { ...missionData, assignedUnitIds: missionData.assignedUnitIds || [] };
    const inc = incidentsRef.current.find(i => i.id === missionData.incidentId);

    // Compute random position for the new mission if not already set (Feature 5)
    // 0.00045 degrees ≈ 50 meters at Oslo's latitude (~60°N)
    if (inc && !missionPositionsRef.current[newMission.id]) {
      const FIFTY_METERS_DEG = 0.00045;
      const angle = Math.random() * 2 * Math.PI;
      const r = Math.random() * FIFTY_METERS_DEG;
      const lat = inc.lat + r * Math.sin(angle);
      const lng = inc.lng + r * Math.cos(angle) / Math.cos(inc.lat * Math.PI / 180);
      missionPositionsRef.current[newMission.id] = { lat, lng };
      setMissionPositions(prev => ({ ...prev, [newMission.id]: { lat, lng } }));
    }

    if (inc && newMission.assignedUnitIds.length > 0) {
      dispatchUnitsToMission(newMission.assignedUnitIds, newMission, inc);
    }
    missionsRef.current = [...missionsRef.current, newMission];
    setMissions([...missionsRef.current]);
  }, []);

  const handleEditMission = useCallback((missionId, changes) => {
    const oldMission = missionsRef.current.find(m => m.id === missionId);
    const newAssigned = changes.assignedUnitIds || oldMission?.assignedUnitIds || [];
    const oldAssigned = oldMission?.assignedUnitIds || [];
    const newlyAssigned = newAssigned.filter(id => !oldAssigned.includes(id));
    if (newlyAssigned.length > 0) {
      const inc = incidentsRef.current.find(i => i.id === (changes.incidentId || oldMission?.incidentId));
      if (inc) {
        const mission = { ...oldMission, ...changes, id: missionId };
        dispatchUnitsToMission(newlyAssigned, mission, inc);
      }
    }
    missionsRef.current = missionsRef.current.map(m => m.id === missionId ? { ...m, ...changes } : m);
    setMissions([...missionsRef.current]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteMission = useCallback((missionId) => {
    missionsRef.current = missionsRef.current.filter(m => m.id !== missionId);
    setMissions([...missionsRef.current]);
  }, []);

  const handleAutoAssign = useCallback(() => {
    const unassigned = missionsRef.current.filter(m => (!m.assignedUnitIds || m.assignedUnitIds.length === 0) && m.status !== 'completed');
    let changed = false;
    unassigned.forEach(mission => {
      const inc = incidentsRef.current.find(i => i.id === mission.incidentId);
      if (!inc) return;
      const free = unitsRef.current.filter(u => !u.assignedIncident && u.status !== 'offline');
      if (free.length === 0) return;
      const closest = free.map(u => ({ unit: u, dist: calcDist(u, inc) })).sort((a, b) => a.dist - b.dist)[0];
      if (!closest) return;
      const uid = closest.unit.id;
      const mPos = missionPositionsRef.current[mission.id] || { lat: inc.lat, lng: inc.lng };
      unitsRef.current = unitsRef.current.map(u => u.id === uid ? { ...u, target: mPos, moving: true, assignedIncident: inc.id, status: 'opptatt', incidentColorIndex: inc.colorIndex ?? 0 } : u);
      missionsRef.current = missionsRef.current.map(m => m.id === mission.id ? { ...m, assignedUnitIds: [uid] } : m);
      changed = true;
    });
    if (changed) {
      setUnits([...unitsRef.current]);
      setMissions([...missionsRef.current]);
      addSystemChat('⚡ Auto-tildeling fullført — nærmeste enheter er utsendt.', '#0078d4');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helper: build the full operation data object ─────────────
  function buildOpData() {
    return {
      operationId:   currentOpId,
      operationName: currentOpName,
      center:        SEED_CONFIG.center,
      zoom:          SEED_CONFIG.zoom,
      aoCoords:      currentAoCoords || SEED_CONFIG.aoCoords,
      aoLabel:       SEED_CONFIG.aoLabel,
      units:         unitsRef.current,
      incidents:     incidentsRef.current,
      missions:      missionsRef.current,
      commander:     SEED_CONFIG.commander,
      aoCenter:      SEED_CONFIG.aoCenter,
      progress:      SEED_CONFIG.progress || 0,
      elapsed:       SEED_CONFIG.elapsed || 0,
      chat:          chatHistory,
      alerts:        SEED_CONFIG.alerts || [],
    };
  }

  // ── Download JSON file (offline save) ─────────────────────
  function downloadJson(opData) {
    const json = JSON.stringify(opData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `operasjon-${currentOpId}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const handleSaveOperation = useCallback(() => {
    downloadJson(buildOpData());
  }, [currentOpId, chatHistory, currentAoCoords]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadOperation = useCallback(() => {
    setLoadDialogOpen(true);
  }, []);

  function openLocalFilePicker() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const opData = JSON.parse(ev.target.result);
          applyLoadedOperation(opData, file.name);
        } catch (err) {
          console.error('Failed to parse operation file:', err);
          addSystemChat('❌ Kunne ikke lese filen. Ugyldig JSON.', '#e74c3c');
        }
      };
      reader.readAsText(file);
    };
    fileInput.click();
  }

  function applyLoadedOperation(opData, label) {
    simTimers.current.forEach(clearTimeout);
    simTimers.current = [];
    if (moveInterval.current) clearInterval(moveInterval.current);
    if (progressInterval.current) clearInterval(progressInterval.current);
    const freshUnits = (opData.units || []).map(u => ({ ...u, target: null, signal: u.signal ?? 4 }));
    unitsRef.current = freshUnits;
    setUnits([...freshUnits]);
    const freshIncidents = opData.incidents || [];
    incidentsRef.current = freshIncidents;
    setIncidents([...freshIncidents]);
    const freshMissions = opData.missions || [];
    missionsRef.current = freshMissions;
    setMissions([...freshMissions]);
    arrivedRef.current = new Set();
    const freshChat = (opData.chat || []).map((m, i) => ({ ...m, id: m.id ?? i }));
    chatIdRef.current = freshChat.length + 1;
    setChatHistory([...freshChat]);
    if (opData.stats) setStats(opData.stats);
    if (opData.center) { setMapCenter(opData.center); setMapZoom(opData.zoom || 12); }
    if (opData.aoCoords) setCurrentAoCoords(opData.aoCoords);
    setScenarioEnded(false);
    setIsPlaying(true);
    isPlayingRef.current = true;
    moveInterval.current = setInterval(() => { tickMovement(); }, 3000);
    addSystemChat(`📂 Operasjon lastet: ${label}`, '#2ecc71');
  }

  const handleCreateNewOperation = useCallback((opName) => {
    simTimers.current.forEach(clearTimeout);
    simTimers.current = [];
    if (moveInterval.current) clearInterval(moveInterval.current);
    unitsRef.current = [];
    incidentsRef.current = [];
    missionsRef.current = [];
    arrivedRef.current = new Set();
    setUnits([]);
    setIncidents([]);
    setMissions([]);
    chatIdRef.current = 2;
    const displayName = opName || 'Ny operasjon';
    setCurrentOpId(displayName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    setCurrentOpName(displayName);
    setChatHistory([{ id: 1, sender: 'System', initials: '⚙', color: '#6b7280', system: true, self: false, time: nowTime(), text: `${displayName} opprettet. Legg til enheter og hendelser.` }]);
    setStats({ units: 0, incidents: 0, tasks: 0, alerts: 0 });
    setScenarioEnded(false);
    setIsPlaying(true);
    isPlayingRef.current = true;
    moveInterval.current = setInterval(() => { tickMovement(); }, 3000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMapClick = useCallback((lat, lng, utm) => {
    if (drawAOMode) {
      if (!aoFirstPoint) {
        setAoFirstPoint({ lat, lng });
      } else {
        const p1 = aoFirstPoint;
        const p2 = { lat, lng };
        const minLat = Math.min(p1.lat, p2.lat);
        const maxLat = Math.max(p1.lat, p2.lat);
        const minLng = Math.min(p1.lng, p2.lng);
        const maxLng = Math.max(p1.lng, p2.lng);
        // Clockwise rectangle: top-left, top-right, bottom-right, bottom-left, close
        const rect = [[minLng, maxLat], [maxLng, maxLat], [maxLng, minLat], [minLng, minLat], [minLng, maxLat]];
        setCurrentAoCoords(rect);
        setDrawAOMode(false);
        setAoFirstPoint(null);
        addSystemChat('🗺 AO rektangel tegnet og oppdatert.', '#0078d4');
      }
      return;
    }
    // Location picking for unit/incident forms
    if (pickingLocation) {
      setPickedLocation({ lat, lng, utm, forForm: pickingLocation });
      setPickingLocation(null);
    }
  }, [drawAOMode, aoFirstPoint, pickingLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirmDeleteOperation = useCallback(() => {
    setDeleteConfirmOpen(false);
    simTimers.current.forEach(clearTimeout);
    simTimers.current = [];
    if (moveInterval.current) clearInterval(moveInterval.current);
    if (progressInterval.current) clearInterval(progressInterval.current);
    unitsRef.current = [];
    incidentsRef.current = [];
    missionsRef.current = [];
    arrivedRef.current = new Set();
    setUnits([]);
    setIncidents([]);
    setMissions([]);
    setCurrentAoCoords(null);
    chatIdRef.current = 2;
    setChatHistory([{ id: 1, sender: 'System', initials: '⚙', color: '#e74c3c', system: true, self: false, time: nowTime(), text: '🗑 Operasjon slettet/nullstilt. All data er fjernet.' }]);
    setStats({ units: 0, incidents: 0, tasks: 0, alerts: 0 });
    setScenarioEnded(false);
    setIsPlaying(true);
    isPlayingRef.current = true;
    moveInterval.current = setInterval(() => { tickMovement(); }, 3000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <CalciteShell class="calcite-theme-dark" style={{ height: '100vh' }}>
      <Header
        currentOpId={currentOpId}
        currentOpName={currentOpName}
        onOperationChange={handleOperationChange}
        onBroadcast={handleBroadcast}
        scenarioEnded={scenarioEnded}
        onSaveOperation={handleSaveOperation}
        onLoadOperation={handleLoadOperation}
        onNewOperation={() => setNewOpDialogOpen(true)}
        onDeleteOperation={() => setDeleteConfirmOpen(true)}
        onDrawAO={() => { setDrawAOMode(v => !v); setAoFirstPoint(null); }}
        drawAOMode={drawAOMode}
        onSettingsChange={(s) => {
          const merged = { ...timingSettingsRef.current, ...s };
          timingSettingsRef.current = merged;
          setTimingSettings(merged);
        }}
        timingConfig={timingSettings}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
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
          onMissionClick={handleMissionClick}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          onOpenRightPanel={() => setRightPanelOpen(true)}
          unreadChat={unreadChat}
          unreadIncidents={unreadIncidents}
          onTabChange={handleTabChange}
          width={sidebarWidth}
        />
        {/* Sidebar resize handle (Feature 3) */}
        <div
          className="panel-resize-handle vertical left"
          onMouseDown={handleSidebarResizeStart}
          title="Dra for å endre bredde"
        />
        {/* Map area */}
        <div className="map-area">
          <Suspense fallback={<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--calcite-color-text-2)', fontSize: '14px' }}>Laster kart…</div>}>
            <ArcGISMap
              center={mapCenter}
              zoom={mapZoom}
              basemap={basemap}
              units={unitsVisible ? units : []}
              incidents={incidentsVisible ? incidents : []}
              missions={missionsVisible ? missions : []}
              missionPositions={missionPositions}
              aoCoords={currentAoCoords || opConfig.aoCoords}
              aoLabel={opConfig.aoLabel}
              onViewReady={(v) => { viewRef.current = v; }}
              onCoordMove={(lat, lng, utm) => setMapCoords({ lat, lng, utm })}
              onZoomChange={setCurrentZoom}
              drawAOMode={drawAOMode}
              onMapClick={handleMapClick}
              unitsVisible={unitsVisible}
              incidentsVisible={incidentsVisible}
              missionsVisible={missionsVisible}
              aoVisible={aoVisible}
              onUnitsVisibleChange={setUnitsVisible}
              onIncidentsVisibleChange={setIncidentsVisible}
              onMissionsVisibleChange={setMissionsVisible}
              onAoVisibleChange={setAoVisible}
              pickingLocation={pickingLocation}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
            />
          </Suspense>

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

            {drawAOMode && (
              <button
                className="map-toolbar-btn active"
                onClick={() => { setDrawAOMode(false); setAoFirstPoint(null); }}
                title="Avbryt AO-tegning"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="0"/>
                </svg>
                {aoFirstPoint ? 'Klikk 2. hjørne' : 'Klikk 1. hjørne'}
              </button>
            )}
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
              <label className="layer-item">
                <input type="checkbox" checked={aoVisible} onChange={e => setAoVisible(e.target.checked)} />
                🗺 AO-område
              </label>
            </div>
          )}

          {/* Info bar */}
          <div className="map-info-bar">
            <span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              {' '}
              {mapCoords && mapCoords.utm
                ? `${formatUTM33(mapCoords.utm)} (UTM33/ETRS89)`
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

          {/* Basemap selector */}
          <div className="basemap-selector-wrap">
            <button
              className="basemap-toggle-btn"
              onClick={e => { e.stopPropagation(); setBasemapSelectorOpen(v => !v); }}
              title="Velg kartbakgrunn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              <span>
                {basemap === 'light' ? 'Gråtone' : basemap === 'kanvas' ? 'Kanvas' : 'Mørkt kart'}
              </span>
            </button>
            {basemapSelectorOpen && (
              <div className="basemap-dropdown" onClick={e => e.stopPropagation()}>
                {[
                  { id: 'dark',   label: 'Mørkt kart' },
                  { id: 'light',  label: 'Gråtone'    },
                  { id: 'kanvas', label: 'Kanvas'      },
                ].map(opt => (
                  <button
                    key={opt.id}
                    className={`basemap-option${basemap === opt.id ? ' active' : ''}`}
                    onClick={() => { setBasemap(opt.id); setBasemapSelectorOpen(false); }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pick-location banner */}
          {pickingLocation && (
            <div className="pick-location-banner">
              📍 Klikk på kartet for å velge plassering
              <button
                className="pick-location-cancel"
                onClick={() => setPickingLocation(null)}
              >
                Avbryt
              </button>
            </div>
          )}

          {/* Play/Pause button — bottom-left of map (Feature 9) */}
          <button
            className="map-play-pause-btn"
            onClick={handlePlayPause}
            title={isPlaying ? 'Pause simulasjon' : 'Start simulasjon'}
          >
            {isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            )}
          </button>
        </div>

        {/* Right panel resize handle */}
        {rightPanelOpen && (
          <div
            className="panel-resize-handle vertical right"
            onMouseDown={handleRightPanelResizeStart}
            title="Dra for å endre bredde"
          />
        )}

        <RightPanel
          open={rightPanelOpen}
          onToggle={() => setRightPanelOpen(v => !v)}
          units={units}
          incidents={incidents}
          missions={missions}
          onAddUnit={handleAddUnit}
          onEditUnit={handleEditUnit}
          onDeleteUnit={handleDeleteUnit}
          onAddIncident={handleAddIncident}
          onEditIncident={handleEditIncident}
          onDeleteIncident={handleDeleteIncident}
          onAddMission={handleAddMission}
          onEditMission={handleEditMission}
          onDeleteMission={handleDeleteMission}
          onAutoAssign={handleAutoAssign}
          onRequestPickLocation={(type) => {
            setPickingLocation(type);
            setPickedLocation(null);
          }}
          pickedLocation={pickedLocation}
          width={rightPanelOpen ? rightPanelWidth : RIGHT_PANEL_TOGGLE_WIDTH}
          mapCenter={mapCenter}
        />
      </div>

      {/* Broadcast modal */}
      <CalciteDialog
        open={broadcastOpen || undefined}
        heading="Send kringkastmelding"
        onCalciteDialogClose={() => setBroadcastOpen(false)}
      >
        <textarea
          className="modal-textarea"
          placeholder="Skriv din kringkastmelding…"
          value={broadcastText}
          onChange={e => setBroadcastText(e.target.value)}
          autoFocus
        />
        <CalciteButton slot="footer-end" onClick={sendBroadcast}>Send til alle enheter</CalciteButton>
        <CalciteButton slot="footer-start" kind="neutral" appearance="outline" onClick={() => setBroadcastOpen(false)}>Avbryt</CalciteButton>
      </CalciteDialog>

      {/* New operation dialog */}
      <CalciteDialog
        open={newOpDialogOpen || undefined}
        heading="Ny operasjon"
        onCalciteDialogClose={() => { setNewOpDialogOpen(false); setNewOpName(''); }}
      >
        <p style={{ color: 'var(--calcite-color-text-2)', fontSize: '13px', marginBottom: '12px' }}>
          Skriv inn navn for den nye operasjonen.
        </p>
        <div style={{ marginBottom: '16px' }}>
          <CalciteLabel>
            Operasjonsnavn (påkrevd)
            <CalciteInput
              placeholder="Skriv inn operasjonsnavn…"
              value={newOpName}
              onCalciteInputInput={e => setNewOpName(e.target.value)}
            />
          </CalciteLabel>
        </div>
        <CalciteButton
          slot="footer-end"
          width="full"
          disabled={!newOpName.trim() || undefined}
          onClick={() => {
            if (!newOpName.trim()) return;
            setNewOpDialogOpen(false);
            handleCreateNewOperation(newOpName.trim());
            setNewOpName('');
          }}
        >
          Opprett tom operasjon
        </CalciteButton>
        <CalciteButton slot="footer-start" kind="neutral" appearance="outline" onClick={() => { setNewOpDialogOpen(false); setNewOpName(''); }}>
          Avbryt
        </CalciteButton>
      </CalciteDialog>

      {/* Load operation — OperationPicker */}
      <OperationPicker
        open={loadDialogOpen}
        onClose={() => setLoadDialogOpen(false)}
        onOpenLocalFile={() => { setLoadDialogOpen(false); openLocalFilePicker(); }}
      />

      {/* Delete confirmation dialog */}
      <CalciteDialog
        open={deleteConfirmOpen || undefined}
        heading="Slett operasjon"
        onCalciteDialogClose={() => setDeleteConfirmOpen(false)}
        kind="danger"
      >
        <p style={{ color: 'var(--calcite-color-text-2)', fontSize: '13px' }}>
          Er du sikker på at du vil slette/nullstille gjeldende operasjon? All data (enheter, hendelser, oppdrag og AO) vil gå tapt.
        </p>
        <CalciteButton slot="footer-end" kind="danger" onClick={confirmDeleteOperation}>
          🗑 Slett permanent
        </CalciteButton>
        <CalciteButton slot="footer-start" kind="neutral" appearance="outline" onClick={() => setDeleteConfirmOpen(false)}>
          Avbryt
        </CalciteButton>
      </CalciteDialog>

      {(layerPanelOpen || basemapSelectorOpen) && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 5 }}
          onClick={() => { setLayerPanelOpen(false); setBasemapSelectorOpen(false); }}
        />
      )}
    </CalciteShell>
  );
}
