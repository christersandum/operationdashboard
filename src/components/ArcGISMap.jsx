import React, { useRef, useEffect, useState } from 'react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import Basemap from '@arcgis/core/Basemap';
import VectorTileLayer from '@arcgis/core/layers/VectorTileLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import Search from '@arcgis/core/widgets/Search';
import { wgs84ToUTM33N } from '../utils/coordUtils';
import './ArcGISMap.css';

// Geodata Online VectorTile basemaps — publicly accessible endpoints
const BASEMAP_TILE_URLS = {
  dark:  'https://services.geodataonline.no/arcgis/rest/services/GeocacheVector/GeocacheGraatone/VectorTileServer',
  light: 'https://services.geodataonline.no/arcgis/rest/services/GeocacheVector/GeocacheBasis/VectorTileServer',
  topo:  'https://services.geodataonline.no/arcgis/rest/services/GeocacheVector/GeocacheTopografiskGra/VectorTileServer',
};

// ── Helper: build a Basemap instance ────────────────────────
function buildBasemap(basemapId) {
  const url = BASEMAP_TILE_URLS[basemapId] ?? BASEMAP_TILE_URLS.dark;
  return new Basemap({
    baseLayers: [new VectorTileLayer({ url })],
  });
}

export default function ArcGISMap({
  center,
  zoom,
  units,
  incidents,
  missions,
  missionPositions,
  aoCoords,
  aoLabel,
  aoVisible,
  onViewReady,
  onCoordMove,
  onZoomChange,
  drawAOMode,
  onMapClick,
  pickingLocation,
  // Layer visibility callbacks
  unitsVisible,
  incidentsVisible,
  missionsVisible,
  onUnitsVisibleChange,
  onIncidentsVisibleChange,
  onMissionsVisibleChange,
  onAoVisibleChange,
}) {
  const mapDivRef   = useRef(null);
  const viewRef     = useRef(null);
  const onMapClickRef = useRef(onMapClick);
  const mapRef      = useRef(null);

  // Refs for values needed inside the init closure to avoid stale captures
  const centerRef   = useRef(center);
  const zoomRef     = useRef(zoom);

  // Single "Kartlag" dropdown state
  const [kartlagOpen, setKartlagOpen] = useState(false);
  // Internal visibility state (synced from props)
  const [localUnitsVisible,     setLocalUnitsVisible]     = useState(unitsVisible !== false);
  const [localIncidentsVisible, setLocalIncidentsVisible] = useState(incidentsVisible !== false);
  const [localMissionsVisible,  setLocalMissionsVisible]  = useState(missionsVisible !== false);
  const [localAoVisible,        setLocalAoVisible]        = useState(aoVisible !== false);

  const unitLayerRef     = useRef(null);
  const incidentLayerRef = useRef(null);
  const missionLayerRef  = useRef(null);
  const aoLayerRef       = useRef(null);

  const unitGraphicsRef     = useRef({});
  const incidentGraphicsRef = useRef({});
  const missionGraphicsRef  = useRef({});

  // ── Keep init-closure refs in sync with latest props ─────────
  useEffect(() => {
    centerRef.current = center;
    zoomRef.current   = zoom;
  }, [center, zoom]);

  // ── Init map once ──────────────────────────────────────────
  useEffect(() => {
    let initialized = false;
    if (!mapDivRef.current || viewRef.current) return;
    initialized = true;

    // ── Operational graphics layers ──────────────────────────
    const unitLayer     = new GraphicsLayer({ id: 'units',     title: 'Enheter'   });
    const incidentLayer = new GraphicsLayer({ id: 'incidents', title: 'Hendelser' });
    const missionLayer  = new GraphicsLayer({ id: 'missions',  title: 'Oppdrag'   });
    const aoLayer       = new GraphicsLayer({ id: 'ao',        title: 'AO-område' });
    unitLayerRef.current     = unitLayer;
    incidentLayerRef.current = incidentLayer;
    missionLayerRef.current  = missionLayer;
    aoLayerRef.current       = aoLayer;

    // ── Map: always use local basemap ───────────────────────
    const map = new Map({
      basemap: buildBasemap('dark'),
      layers: [aoLayer, missionLayer, incidentLayer, unitLayer],
    });
    mapRef.current = map;

    // ── MapView — WGS84 ─────────────────────────────────────
    const view = new MapView({
      container: mapDivRef.current,
      map: map,
      center: centerRef.current,
      zoom: zoomRef.current,
      spatialReference: { wkid: 4326 },
      ui: { components: ['zoom'] },
      popup: { dockEnabled: true, dockOptions: { position: 'top-right', breakpoint: false } },
    });
    viewRef.current = view;

    // ── Search widget (Kartverket free geocoding) ─────────
    view.when(() => {
      if (view.destroyed) return;

      if (onZoomChange) onZoomChange(Math.round(view.zoom));

      const kartverkSource = {
        name: 'Adressesøk (Kartverket)',
        placeholder: 'Søk adresse i Norge…',
        maxSuggestions: 6,
        getSuggestions: async (params) => {
          const text = params.suggestTerm;
          if (!text || text.length < 2) return [];
          try {
            const url = `https://ws.geonorge.no/adresser/v1/sok?sok=${encodeURIComponent(text)}&fuzzy=true&treffPerSide=6`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            if (!Array.isArray(data.adresser)) return [];
            return data.adresser.map((a, i) => ({
              key: `kv-${i}`,
              text: `${a.adressetekst ?? ''}, ${a.postnummer ?? ''} ${a.poststed ?? ''}`,
              sourceIndex: params.sourceIndex,
            }));
          } catch {
            return [];
          }
        },
        getResults: async (params) => {
          const text = params.suggestResult?.text || '';
          if (!text) return [];
          try {
            const url = `https://ws.geonorge.no/adresser/v1/sok?sok=${encodeURIComponent(text)}&treffPerSide=1`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            const a = data.adresser?.[0];
            if (!a || !a.representasjonspunkt?.lon || !a.representasjonspunkt?.lat) return [];
            const name = `${a.adressetekst ?? ''}, ${a.postnummer ?? ''} ${a.poststed ?? ''}`;
            const feature = new Graphic({
              geometry: new Point({
                longitude: a.representasjonspunkt.lon,
                latitude: a.representasjonspunkt.lat,
                spatialReference: { wkid: 4326 },
              }),
              attributes: { name },
            });
            return [{ extent: null, feature, target: feature, name }];
          } catch {
            return [];
          }
        },
      };

      const searchWidget = new Search({
        view,
        includeDefaultSources: false,
        sources: [kartverkSource],
        searchAllEnabled: false,
      });
      view.ui.add(searchWidget, 'top-right');

      if (!view.destroyed && onViewReady) onViewReady(view);
    });

    // ── Pointer move → UTM33 coords for status bar ───────────
    view.on('pointer-move', (evt) => {
      const pt = view.toMap({ x: evt.x, y: evt.y });
      if (pt && onCoordMove) {
        const utm = wgs84ToUTM33N(pt.latitude, pt.longitude);
        onCoordMove(pt.latitude, pt.longitude, { easting: Math.round(utm.easting), northing: Math.round(utm.northing) });
      }
    });

    // ── Map click ────────────────────────────────────────────
    view.on('click', (evt) => {
      const pt = view.toMap({ x: evt.x, y: evt.y });
      if (pt && onMapClickRef.current) {
        const utm = wgs84ToUTM33N(pt.latitude, pt.longitude);
        onMapClickRef.current(pt.latitude, pt.longitude, { easting: Math.round(utm.easting), northing: Math.round(utm.northing) });
      }
    });

    view.watch('zoom', (z) => {
      if (onZoomChange) onZoomChange(Math.round(z));
    });

    return () => {
      if (!initialized) return;
      view.destroy();
      viewRef.current = null;
      mapRef.current = null;
      unitLayerRef.current = null;
      incidentLayerRef.current = null;
      missionLayerRef.current = null;
      aoLayerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync onMapClick ref (fix stale closure bug) ────────────
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // ── Sync local visibility state when props change ──────────
  useEffect(() => {
    setLocalUnitsVisible(unitsVisible !== false);
    setLocalIncidentsVisible(incidentsVisible !== false);
    setLocalMissionsVisible(missionsVisible !== false);
    setLocalAoVisible(aoVisible !== false);
  }, [unitsVisible, incidentsVisible, missionsVisible, aoVisible]);

  // ── Picking location → crosshair cursor ───────────────────
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.cursor = pickingLocation ? 'crosshair' : 'default';
    }
  }, [pickingLocation]);

  // ── Fly to new center/zoom ─────────────────────────────────
  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.goTo({ center: center, zoom }, { animate: true, duration: 600 }).catch(() => {});
  }, [center, zoom]);

  // ── AO polygon ────────────────────────────────────────────
  useEffect(() => {
    if (!aoLayerRef.current) return;
    aoLayerRef.current.removeAll();
    if (!aoCoords || aoCoords.length === 0) return;
    // aoCoords is [[lon, lat], ...] — use directly for WGS84
    const rings = [aoCoords.map(([lon, lat]) => [lon, lat])];
    const polygon = new Polygon({
      rings,
      spatialReference: { wkid: 4326 },
    });
    const graphic = new Graphic({
      geometry: polygon,
      symbol: new SimpleFillSymbol({
        color: [0, 120, 212, 30],
        outline: new SimpleLineSymbol({ color: [0, 120, 212, 153], width: 1.5, style: 'dash' }),
      }),
      popupTemplate: new PopupTemplate({ title: aoLabel }),
    });
    aoLayerRef.current.add(graphic);
  }, [aoCoords, aoLabel]);

  // ── AO visibility ──────────────────────────────────────────
  useEffect(() => {
    if (aoLayerRef.current) {
      aoLayerRef.current.visible = aoVisible !== false;
    }
  }, [aoVisible]);

  // ── Unit graphics ──────────────────────────────────────────
  useEffect(() => {
    if (!unitLayerRef.current) return;
    const layer = unitLayerRef.current;
    const existingIds = new Set(Object.keys(unitGraphicsRef.current));

    units.forEach(unit => {
      const pt = new Point({ longitude: unit.lng, latitude: unit.lat, spatialReference: { wkid: 4326 } });

      if (unitGraphicsRef.current[unit.id]) {
        const g = unitGraphicsRef.current[unit.id];
        g.geometry = pt;
        g.symbol   = makeUnitSymbol(unit);
      } else {
        const g = new Graphic({
          geometry: pt,
          symbol: makeUnitSymbol(unit),
          attributes: { ...unit },
          popupTemplate: makeUnitPopupTemplate(unit),
        });
        layer.add(g);
        unitGraphicsRef.current[unit.id] = g;
      }
      existingIds.delete(unit.id);
    });

    existingIds.forEach(id => {
      const g = unitGraphicsRef.current[id];
      if (g) layer.remove(g);
      delete unitGraphicsRef.current[id];
    });
  }, [units]);

  // ── Incident graphics ──────────────────────────────────────
  useEffect(() => {
    if (!incidentLayerRef.current) return;
    const layer = incidentLayerRef.current;
    const existingIds = new Set(Object.keys(incidentGraphicsRef.current));

    incidents.forEach(inc => {
      const pt = new Point({ longitude: inc.lng, latitude: inc.lat, spatialReference: { wkid: 4326 } });

      if (incidentGraphicsRef.current[inc.id]) {
        const g = incidentGraphicsRef.current[inc.id];
        g.geometry = pt;
        g.symbol   = makeIncidentSymbol(inc);
      } else {
        const g = new Graphic({
          geometry: pt,
          symbol: makeIncidentSymbol(inc),
          attributes: { ...inc },
          popupTemplate: makeIncidentPopupTemplate(inc),
        });
        layer.add(g);
        incidentGraphicsRef.current[inc.id] = g;
      }
      existingIds.delete(inc.id);
    });

    existingIds.forEach(id => {
      const g = incidentGraphicsRef.current[id];
      if (g) layer.remove(g);
      delete incidentGraphicsRef.current[id];
    });
  }, [incidents]);

  // ── Mission graphics ──────────────────────────────────────
  useEffect(() => {
    if (!missionLayerRef.current || !incidents) return;
    const layer = missionLayerRef.current;
    const existingIds = new Set(Object.keys(missionGraphicsRef.current));

    (missions || []).forEach((mission) => {
      const inc = incidents.find(i => i.id === mission.incidentId);
      if (!inc) return;

      // Use provided random position or fall back to incident location
      const pos = (missionPositions && missionPositions[mission.id]) || { lat: inc.lat, lng: inc.lng };
      const pt = new Point({ longitude: pos.lng, latitude: pos.lat, spatialReference: { wkid: 4326 } });
      const completed = mission.status === 'completed';

      if (missionGraphicsRef.current[mission.id]) {
        const g = missionGraphicsRef.current[mission.id];
        g.geometry = pt;
        g.symbol = makeMissionSymbol(completed);
      } else {
        const g = new Graphic({
          geometry: pt,
          symbol: makeMissionSymbol(completed),
          attributes: { ...mission },
          popupTemplate: new PopupTemplate({
            title: `📋 ${mission.title}`,
            content: `<table style="font-size:12px; color:#e8eaf0; width:100%;">
              <tr><td style="color:#9aa3b5">Status</td><td>${completed ? '✅ Fullført' : '🔴 Aktiv'}</td></tr>
              <tr><td style="color:#9aa3b5">Hendelse</td><td>${inc.title}</td></tr>
              <tr><td colspan="2" style="color:#9aa3b5; padding-top:4px">${mission.desc}</td></tr>
            </table>`,
          }),
        });
        layer.add(g);
        missionGraphicsRef.current[mission.id] = g;
      }
      existingIds.delete(mission.id);
    });

    existingIds.forEach(id => {
      const g = missionGraphicsRef.current[id];
      if (g) layer.remove(g);
      delete missionGraphicsRef.current[id];
    });
  }, [missions, incidents, missionPositions]);

  // ── Helper: toggle layer visibility from dropdown ──────────
  const handleUnitsToggle    = (v) => { setLocalUnitsVisible(v);     if (unitLayerRef.current) unitLayerRef.current.visible = v;     if (onUnitsVisibleChange) onUnitsVisibleChange(v); };
  const handleIncToggle      = (v) => { setLocalIncidentsVisible(v); if (incidentLayerRef.current) incidentLayerRef.current.visible = v; if (onIncidentsVisibleChange) onIncidentsVisibleChange(v); };
  const handleMissionsToggle = (v) => { setLocalMissionsVisible(v);  if (missionLayerRef.current) missionLayerRef.current.visible = v;  if (onMissionsVisibleChange) onMissionsVisibleChange(v); };
  const handleAoToggle       = (v) => { setLocalAoVisible(v);        if (aoLayerRef.current) aoLayerRef.current.visible = v;           if (onAoVisibleChange) onAoVisibleChange(v); };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />

      {/* Single "Kartlag" dropdown — top-left */}
      <div className="map-layer-dropdown" style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10 }}>
        <button
          className={`map-layer-dropdown-btn${kartlagOpen ? ' active' : ''}`}
          onClick={() => setKartlagOpen(v => !v)}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
            <polyline points="2 17 12 22 22 17"/>
            <polyline points="2 12 12 17 22 12"/>
          </svg>
          Kartlag
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points={kartlagOpen ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}/>
          </svg>
        </button>
        {kartlagOpen && (
          <div className="map-layer-dropdown-panel" onClick={e => e.stopPropagation()}>
            <div className="map-layer-dropdown-title">Kartlag</div>
            <label className="layer-item">
              <input type="checkbox" checked={localUnitsVisible} onChange={e => handleUnitsToggle(e.target.checked)} />
              👮 Enheter
            </label>
            <label className="layer-item">
              <input type="checkbox" checked={localIncidentsVisible} onChange={e => handleIncToggle(e.target.checked)} />
              ❗ Hendelser
            </label>
            <label className="layer-item">
              <input type="checkbox" checked={localMissionsVisible} onChange={e => handleMissionsToggle(e.target.checked)} />
              📋 Oppdrag
            </label>
            <label className="layer-item">
              <input type="checkbox" checked={localAoVisible} onChange={e => handleAoToggle(e.target.checked)} />
              🗺 AO-område
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────

function makeUnitSymbol(unit) {
  const color = getStatusColorRgba(unit.status);
  return {
    type: 'simple-marker',
    style: 'circle',
    color: `rgba(${color[0]},${color[1]},${color[2]},${color[3] / 255})`,
    size: 14,
    outline: { color: 'white', width: 1.5 },
  };
}

function makeIncidentSymbol(inc) {
  const color = getPriorityColorRgba(inc.priority);
  return {
    type: 'simple-marker',
    style: 'square',
    color: `rgba(${color[0]},${color[1]},${color[2]},${color[3] / 255})`,
    size: 16,
    outline: { color: 'white', width: 1.5 },
  };
}

function makeMissionSymbol(completed) {
  return {
    type: 'simple-marker',
    style: 'diamond',
    color: completed ? 'rgba(46,204,113,0.8)' : 'rgba(231,76,60,0.8)',
    size: 12,
    outline: { color: 'white', width: 1 },
  };
}

function getStatusColorRgba(status) {
  if (status === 'ledig' || status === 'online') return [46, 204, 113, 220];
  if (status === 'opptatt') return [243, 156, 18, 220];
  if (status === 'warning') return [243, 156, 18, 220];
  return [107, 114, 128, 220];
}

function getPriorityColorRgba(priority) {
  if (priority === 'alarm')  return [220, 20, 60, 200];
  if (priority === 'high')   return [231, 76, 60, 200];
  if (priority === 'medium') return [243, 156, 18, 200];
  return [46, 204, 113, 200];
}

function makeUnitPopupTemplate(unit) {
  const statusText = unit.status === 'offline' ? 'Offline'
    : unit.status === 'opptatt' ? 'Opptatt'
    : 'Ledig';
  return new PopupTemplate({
    title: `<b>${unit.name}</b> — ${unit.id}`,
    content: `
      <table style="font-size:12px; color:#e8eaf0; width:100%;">
        <tr><td style="color:#9aa3b5">Rolle</td><td>${unit.role}</td></tr>
        <tr><td style="color:#9aa3b5">Status</td><td>${statusText}</td></tr>
        <tr><td style="color:#9aa3b5">Bevegelse</td><td>${unit.moving ? 'Beveger seg' : 'Stasjonær'}</td></tr>
        ${unit.assignedIncident ? `<tr><td style="color:#9aa3b5">Oppdrag</td><td style="color:#f39c12">${unit.assignedIncident}</td></tr>` : ''}
      </table>`,
  });
}

function makeIncidentPopupTemplate(inc) {
  const priorityLabel = inc.priority === 'alarm' ? '🚨 ALARM'
    : inc.priority === 'high' ? 'HØY'
    : inc.priority === 'medium' ? 'MEDIUM' : 'LAV';
  return new PopupTemplate({
    title: `${inc.icon} ${inc.title}`,
    content: `
      <table style="font-size:12px; color:#e8eaf0; width:100%;">
        <tr><td style="color:#9aa3b5">ID</td><td>${inc.id}</td></tr>
        <tr><td style="color:#9aa3b5">Tid</td><td>${inc.time || '--'}</td></tr>
        <tr><td style="color:#9aa3b5">Prioritet</td><td>${priorityLabel}</td></tr>
        <tr><td colspan="2" style="color:#9aa3b5; padding-top:4px">${inc.desc}</td></tr>
      </table>`,
  });
}
