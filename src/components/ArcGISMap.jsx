import React, { useRef, useEffect } from 'react';
import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';
import Basemap from '@arcgis/core/Basemap';
import VectorTileLayer from '@arcgis/core/layers/VectorTileLayer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import Search from '@arcgis/core/widgets/Search';
import PortalItem from '@arcgis/core/portal/PortalItem';
import {
  LIGHT_BASEMAP_URL,
  DARK_BASEMAP_URL,
  BASEMAP_OPTIONS,
  INCIDENT_COLORS,
  SKOLER_BARNEHAGER_URL,
  SEARCH_LOCATOR_ITEM_ID,
  SEARCH_PORTAL_URL,
} from '../data';
import { wgs84ToUTM33N } from '../utils/coordUtils';

// Mission marker positioning: offset from incident so markers don't overlap
const MISSION_MARKER_OFFSET = 0.001; // ~100 m in degrees
const MISSION_GRID_COLS     = 3;     // arrange markers in 3-column grid

// ── Helper: build a Basemap instance from a BASEMAP_OPTIONS entry ──
function buildBasemap(basemapId) {
  const option = BASEMAP_OPTIONS.find(b => b.id === basemapId);
  if (!option || option.type === 'custom') {
    // Norwegian custom VectorTileServer basemaps
    const url = basemapId === 'light' ? LIGHT_BASEMAP_URL : DARK_BASEMAP_URL;
    return new Basemap({ baseLayers: [new VectorTileLayer({ url })] });
  }
  // ArcGIS Online named basemap (uses built-in style)
  return new Basemap({ style: { id: basemapId } });
}

export default function ArcGISMap({
  center,
  zoom,
  basemap,
  units,
  incidents,
  missions,
  aoCoords,
  aoLabel,
  onViewReady,
  onCoordMove,
  onZoomChange,
  drawAOMode,
  onMapClick,
  skolerBarnehagerVisible,
  pickingLocation,
}) {
  const mapDivRef   = useRef(null);
  const viewRef     = useRef(null);
  const drawAOModeRef = useRef(drawAOMode);
  const mapRef      = useRef(null);
  const basemapRef  = useRef(basemap);

  const skolerLayerRef   = useRef(null);
  const unitLayerRef     = useRef(null);
  const incidentLayerRef = useRef(null);
  const missionLayerRef  = useRef(null);
  const aoLayerRef       = useRef(null);

  const unitGraphicsRef     = useRef({});
  const incidentGraphicsRef = useRef({});
  const missionGraphicsRef  = useRef({});

  // ── Init map once ──────────────────────────────────────────
  useEffect(() => {
    if (!mapDivRef.current || viewRef.current) return;

    // ── Skoler og barnehager FeatureLayer ────────────────────
    const skolerLayer = new FeatureLayer({
      url: SKOLER_BARNEHAGER_URL,
      id: 'skoler_barnehager',
      title: 'Skoler og barnehager',
      visible: !!skolerBarnehagerVisible,
      renderer: {
        type: 'simple',
        symbol: {
          type: 'simple-marker',
          style: 'square',
          color: [255, 200, 0, 180],
          size: 8,
          outline: { color: [255, 200, 0, 255], width: 1.5 },
        },
      },
    });
    skolerLayerRef.current = skolerLayer;

    // ── Operational graphics layers ──────────────────────────
    const unitLayer     = new GraphicsLayer({ id: 'units' });
    const incidentLayer = new GraphicsLayer({ id: 'incidents' });
    const missionLayer  = new GraphicsLayer({ id: 'missions' });
    const aoLayer       = new GraphicsLayer({ id: 'ao' });
    unitLayerRef.current     = unitLayer;
    incidentLayerRef.current = incidentLayer;
    missionLayerRef.current  = missionLayer;
    aoLayerRef.current       = aoLayer;

    // ── WebMap with initial basemap ──────────────────────────
    const webMap = new WebMap({
      basemap: buildBasemap(basemap),
      layers: [skolerLayer, aoLayer, missionLayer, incidentLayer, unitLayer],
    });
    mapRef.current = webMap;

    // ── MapView ──────────────────────────────────────────────
    const view = new MapView({
      container: mapDivRef.current,
      map: webMap,
      center,
      zoom,
      ui: { components: ['zoom'] },
    });
    viewRef.current = view;

    // ── Search widget with locator from beredskap portal ─────
    view.when(async () => {
      // Report initial zoom once the view is ready
      if (onZoomChange) onZoomChange(Math.round(view.zoom));

      let searchSources = [];
      try {
        const portalItem = new PortalItem({
          id: SEARCH_LOCATOR_ITEM_ID,
          portal: { url: SEARCH_PORTAL_URL },
        });
        await portalItem.load();
        if (portalItem.url) {
          searchSources = [{
            url: portalItem.url,
            singleLineFieldName: 'SingleLine',
            name: 'Adressesøk (DSB)',
            placeholder: 'Søk sted eller adresse…',
            outFields: ['*'],
          }];
        }
      } catch (err) {
        // Portal item unavailable (network blocked or auth required) — Search widget falls back to its default sources
        console.warn('[ArcGISMap] Could not load search locator from portal item:', err);
      }

      const searchWidget = new Search({
        view,
        includeDefaultSources: searchSources.length === 0,
        sources: searchSources,
        searchAllEnabled: false,
      });
      view.ui.add(searchWidget, 'top-right');

      if (onViewReady) onViewReady(view);
    });

    // ── Pointer move → UTM33 coords ──────────────────────────
    view.on('pointer-move', (evt) => {
      const pt = view.toMap({ x: evt.x, y: evt.y });
      if (pt && onCoordMove) {
        const utm = wgs84ToUTM33N(pt.latitude, pt.longitude);
        onCoordMove(pt.latitude, pt.longitude, utm);
      }
    });

    // ── Map click ────────────────────────────────────────────
    view.on('click', (evt) => {
      const pt = view.toMap({ x: evt.x, y: evt.y });
      if (pt && onMapClick) {
        const utm = wgs84ToUTM33N(pt.latitude, pt.longitude);
        onMapClick(pt.latitude, pt.longitude, utm);
      }
    });

    view.watch('zoom', (z) => {
      if (onZoomChange) onZoomChange(Math.round(z));
    });

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync drawAOMode ref ────────────────────────────────────
  useEffect(() => {
    drawAOModeRef.current = drawAOMode;
  }, [drawAOMode]);

  // ── Picking location → crosshair cursor ───────────────────
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.cursor = pickingLocation ? 'crosshair' : 'default';
    }
  }, [pickingLocation]);

  // ── Basemap switch ─────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    if (basemap === basemapRef.current) return;
    mapRef.current.basemap = buildBasemap(basemap);
    basemapRef.current = basemap;
  }, [basemap]);

  // ── Fly to new center/zoom ─────────────────────────────────
  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.goTo({ center, zoom }, { animate: true, duration: 600 }).catch(() => {});
  }, [center, zoom]);

  // ── Skoler/Barnehager visibility ──────────────────────────
  useEffect(() => {
    if (skolerLayerRef.current) {
      skolerLayerRef.current.visible = !!skolerBarnehagerVisible;
    }
  }, [skolerBarnehagerVisible]);

  // ── AO polygon ────────────────────────────────────────────
  useEffect(() => {
    if (!aoLayerRef.current) return;
    aoLayerRef.current.removeAll();
    if (!aoCoords || aoCoords.length === 0) return;
    const polygon = new Polygon({
      rings: [aoCoords],
      spatialReference: { wkid: 4326 },
    });
    const graphic = new Graphic({
      geometry: polygon,
      symbol: new SimpleFillSymbol({
        color: [0, 120, 212, 0.06],
        outline: new SimpleLineSymbol({ color: [0, 120, 212, 0.6], width: 1.5, style: 'dash' }),
      }),
      popupTemplate: new PopupTemplate({ title: aoLabel }),
    });
    aoLayerRef.current.add(graphic);
  }, [aoCoords, aoLabel]);

  // ── Unit graphics ──────────────────────────────────────────
  useEffect(() => {
    if (!unitLayerRef.current) return;
    const layer = unitLayerRef.current;
    const existingIds = new Set(Object.keys(unitGraphicsRef.current));

    units.forEach(unit => {
      const color = getUnitColor(unit);
      const statusColor = getStatusColor(unit.status);
      const pt = new Point({ longitude: unit.lng, latitude: unit.lat, spatialReference: { wkid: 4326 } });

      if (unitGraphicsRef.current[unit.id]) {
        const g = unitGraphicsRef.current[unit.id];
        g.geometry = pt;
        g.symbol   = makeUnitSymbol(color, statusColor);
      } else {
        const g = new Graphic({
          geometry: pt,
          symbol: makeUnitSymbol(color, statusColor),
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
      const priorityColor = getPriorityColor(inc.priority);
      const pt = new Point({ longitude: inc.lng, latitude: inc.lat, spatialReference: { wkid: 4326 } });

      if (incidentGraphicsRef.current[inc.id]) {
        incidentGraphicsRef.current[inc.id].geometry = pt;
      } else {
        const g = new Graphic({
          geometry: pt,
          symbol: makeIncidentSymbol(priorityColor, inc.icon),
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

  // ── Mission graphics ────────────────────────────────────────
  useEffect(() => {
    if (!missionLayerRef.current || !incidents) return;
    const layer = missionLayerRef.current;
    const existingIds = new Set(Object.keys(missionGraphicsRef.current));

    (missions || []).forEach((mission, idx) => {
      const inc = incidents.find(i => i.id === mission.incidentId);
      if (!inc) return;

      const offsetLat = inc.lat + MISSION_MARKER_OFFSET * (idx % MISSION_GRID_COLS - 1);
      const offsetLng = inc.lng + MISSION_MARKER_OFFSET * Math.floor(idx / MISSION_GRID_COLS);

      const pt = new Point({ longitude: offsetLng, latitude: offsetLat, spatialReference: { wkid: 4326 } });
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
  }, [missions, incidents]);

  return (
    <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />
  );
}

// ── Helpers ────────────────────────────────────────────────

function getPriorityColor(priority) {
  if (priority === 'alarm')  return [220, 20, 60];
  if (priority === 'high')   return [231, 76, 60];
  if (priority === 'medium') return [243, 156, 18];
  return [46, 204, 113];
}

function getUnitColor(unit) {
  if (!unit.assignedIncident) return [107, 114, 128];
  const idx = unit.incidentColorIndex ?? 0;
  const hex = INCIDENT_COLORS[idx % INCIDENT_COLORS.length];
  return hexToRgb(hex);
}

function getStatusColor(status) {
  if (status === 'ledig' || status === 'online') return [46, 204, 113];
  if (status === 'opptatt') return [243, 156, 18];
  if (status === 'warning') return [243, 156, 18];
  return [107, 114, 128];
}

function makeUnitSymbol(color, statusColor) {
  return new SimpleMarkerSymbol({
    style: 'circle',
    color: [...color, 220],
    size: 18,
    outline: {
      color: [...statusColor, 255],
      width: 2.5,
    },
  });
}

function makeIncidentSymbol(color) {
  return new SimpleMarkerSymbol({
    style: 'square',
    color: [...color, 60],
    size: 22,
    outline: { color: [...color, 220], width: 2 },
  });
}

function makeMissionSymbol(completed) {
  const color = completed ? [46, 204, 113] : [231, 76, 60];
  return new SimpleMarkerSymbol({
    style: 'square',
    color: [...color, 180],
    size: 12,
    outline: { color: [...color, 255], width: 1.5 },
  });
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

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}
