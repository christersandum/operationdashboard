import React, { useRef, useEffect } from 'react';
import MapView from '@arcgis/core/views/MapView';
import Map from '@arcgis/core/Map';
import VectorTileLayer from '@arcgis/core/layers/VectorTileLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import { LIGHT_BASEMAP_URL, DARK_BASEMAP_URL, INCIDENT_COLORS } from '../data';

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
}) {
  const mapDivRef   = useRef(null);
  const viewRef     = useRef(null);
  const mapRef      = useRef(null);
  const darkLayerRef  = useRef(null);
  const lightLayerRef = useRef(null);
  const unitLayerRef  = useRef(null);
  const incidentLayerRef = useRef(null);
  const missionLayerRef  = useRef(null);
  const aoLayerRef    = useRef(null);
  const unitGraphicsRef     = useRef({});
  const incidentGraphicsRef = useRef({});
  const missionGraphicsRef  = useRef({});
  const basemapRef  = useRef(basemap);

  // ── Init map once ──────────────────────────────────────────
  useEffect(() => {
    if (!mapDivRef.current || viewRef.current) return;

    const darkLayer  = new VectorTileLayer({ url: DARK_BASEMAP_URL });
    const lightLayer = new VectorTileLayer({ url: LIGHT_BASEMAP_URL });
    darkLayerRef.current  = darkLayer;
    lightLayerRef.current = lightLayer;

    const unitLayer     = new GraphicsLayer({ id: 'units' });
    const incidentLayer = new GraphicsLayer({ id: 'incidents' });
    const missionLayer  = new GraphicsLayer({ id: 'missions' });
    const aoLayer       = new GraphicsLayer({ id: 'ao' });
    unitLayerRef.current     = unitLayer;
    incidentLayerRef.current = incidentLayer;
    missionLayerRef.current  = missionLayer;
    aoLayerRef.current       = aoLayer;

    const arcgisMap = new Map({
      layers: [darkLayer, aoLayer, missionLayer, incidentLayer, unitLayer],
    });
    mapRef.current = arcgisMap;

    const view = new MapView({
      container: mapDivRef.current,
      map: arcgisMap,
      center,
      zoom,
      ui: { components: ['zoom'] },
    });
    viewRef.current = view;

    view.on('pointer-move', (evt) => {
      const pt = view.toMap({ x: evt.x, y: evt.y });
      if (pt && onCoordMove) onCoordMove(pt.latitude, pt.longitude);
    });

    view.watch('zoom', (z) => {
      if (onZoomChange) onZoomChange(Math.round(z));
    });

    view.when(() => {
      if (onViewReady) onViewReady(view);
    });

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Basemap switch ─────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !darkLayerRef.current || !lightLayerRef.current) return;
    const arcgisMap = mapRef.current;
    if (basemap === 'dark') {
      arcgisMap.remove(lightLayerRef.current);
      if (!arcgisMap.layers.includes(darkLayerRef.current)) {
        arcgisMap.add(darkLayerRef.current, 0);
      }
    } else {
      arcgisMap.remove(darkLayerRef.current);
      if (!arcgisMap.layers.includes(lightLayerRef.current)) {
        arcgisMap.add(lightLayerRef.current, 0);
      }
    }
    basemapRef.current = basemap;
  }, [basemap]);

  // ── Fly to new center/zoom ─────────────────────────────────
  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.goTo({ center, zoom }, { animate: true, duration: 600 }).catch(() => {});
  }, [center, zoom]);

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

      const offsetLat = inc.lat + 0.001 * (idx % 3 - 1);
      const offsetLng = inc.lng + 0.001 * Math.floor(idx / 3);

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

function makeIncidentSymbol(color, icon) {
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
