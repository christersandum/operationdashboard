import React, { useRef, useEffect, useState } from 'react';
import Map from '@arcgis/core/Map';
import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';
import Basemap from '@arcgis/core/Basemap';
import WebTileLayer from '@arcgis/core/layers/WebTileLayer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol';
import CIMSymbol from '@arcgis/core/symbols/CIMSymbol';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import Search from '@arcgis/core/widgets/Search';
import SearchSource from '@arcgis/core/widgets/Search/SearchSource';
import BasemapGallery from '@arcgis/core/widgets/BasemapGallery';
import Portal from '@arcgis/core/portal/Portal';
import PortalItem from '@arcgis/core/portal/PortalItem';
import {
  SKOLER_BARNEHAGER_URL,
  SEARCH_LOCATOR_ITEM_ID,
  SEARCH_PORTAL_URL,
  PORTAL_URL,
} from '../data';
import { wgs84ToUTM33N } from '../utils/coordUtils';
import './ArcGISMap.css';

// CartoDB free raster basemaps (no API key required)
const BASEMAP_URLS = {
  dark:   'https://{subDomain}.basemaps.cartocdn.com/dark_all/{level}/{col}/{row}.png',
  light:  'https://{subDomain}.basemaps.cartocdn.com/light_all/{level}/{col}/{row}.png',
  kanvas: 'https://{subDomain}.basemaps.cartocdn.com/rastertiles/voyager/{level}/{col}/{row}.png',
};

// ── Helper: build a Basemap instance ────────────────────────
function buildBasemap(basemapId) {
  const url = BASEMAP_URLS[basemapId] ?? BASEMAP_URLS.dark;
  return new Basemap({
    baseLayers: [new WebTileLayer({
      urlTemplate: url,
      subDomains: ['a', 'b', 'c', 'd'],
      copyright: '© OpenStreetMap contributors, © CARTO',
    })],
  });
}

export default function ArcGISMap({
  center,
  zoom,
  basemap,
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
  skolerBarnehagerVisible,
  pickingLocation,
  isSignedIn,
  webmapId,
  // Layer visibility callbacks (Feature 8)
  unitsVisible,
  incidentsVisible,
  missionsVisible,
  onUnitsVisibleChange,
  onIncidentsVisibleChange,
  onMissionsVisibleChange,
  onAoVisibleChange,
  onSkolerVisibleChange,
}) {
  const mapDivRef   = useRef(null);
  const viewRef     = useRef(null);
  const drawAOModeRef = useRef(drawAOMode);
  const onMapClickRef = useRef(onMapClick);
  const mapRef      = useRef(null);
  const basemapRef  = useRef(basemap);
  const basemapGalleryRef = useRef(null);
  const isSignedInRef = useRef(isSignedIn);

  // Feature 8: two dropdown states
  const [kartlagOpen, setKartlagOpen] = useState(false);
  const [opsdataOpen, setOpsdataOpen] = useState(false);
  // Internal visibility state (synced from props)
  const [localUnitsVisible, setLocalUnitsVisible] = useState(unitsVisible !== false);
  const [localIncidentsVisible, setLocalIncidentsVisible] = useState(incidentsVisible !== false);
  const [localMissionsVisible, setLocalMissionsVisible] = useState(missionsVisible !== false);
  const [localAoVisible, setLocalAoVisible] = useState(aoVisible !== false);
  const [localSkolerVisible, setLocalSkolerVisible] = useState(!!skolerBarnehagerVisible);

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
    const unitLayer     = new GraphicsLayer({ id: 'units',     title: 'Enheter'   });
    const incidentLayer = new GraphicsLayer({ id: 'incidents', title: 'Hendelser' });
    const missionLayer  = new GraphicsLayer({ id: 'missions',  title: 'Oppdrag'   });
    const aoLayer       = new GraphicsLayer({ id: 'ao',        title: 'AO-område' });
    unitLayerRef.current     = unitLayer;
    incidentLayerRef.current = incidentLayer;
    missionLayerRef.current  = missionLayer;
    aoLayerRef.current       = aoLayer;

    // ── Map: use WebMap if webmapId is given (Feature 1), else offline basemap ──
    let map;
    if (webmapId) {
      map = new WebMap({ portalItem: { id: webmapId } });
      map.add(skolerLayer);
      map.add(aoLayer);
      map.add(missionLayer);
      map.add(incidentLayer);
      map.add(unitLayer);
    } else {
      map = new Map({
        basemap: buildBasemap(basemap),
        layers: [skolerLayer, aoLayer, missionLayer, incidentLayer, unitLayer],
      });
    }
    mapRef.current = map;

    // ── MapView ──────────────────────────────────────────────
    const view = new MapView({
      container: mapDivRef.current,
      map: map,
      center,
      zoom,
      ui: { components: ['zoom'] },
      popup: { dockEnabled: true, dockOptions: { position: 'top-right', breakpoint: false } },
    });
    viewRef.current = view;

    // ── Search widget with locator from beredskap portal ─────
    view.when(async () => {
      // Report initial zoom once the view is ready
      if (onZoomChange) onZoomChange(Math.round(view.zoom));

      let searchSources = [];
      if (isSignedInRef.current) {
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
          // Portal item unavailable (network error or insufficient permissions)
          console.warn('[ArcGISMap] Could not load search locator from portal item:', err);
        }
      }

      // Always include Kartverket free geocoding as a fallback for Norwegian addresses
      const kartverkSource = new SearchSource({
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
      });
      searchSources.push(kartverkSource);

      // Disable default ArcGIS sources — they require an API key or portal auth.
      // Kartverket source above provides free Norwegian address search without auth.
      const searchWidget = new Search({
        view,
        includeDefaultSources: false,
        sources: searchSources,
        searchAllEnabled: searchSources.length > 1,
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
      if (pt && onMapClickRef.current) {
        const utm = wgs84ToUTM33N(pt.latitude, pt.longitude);
        onMapClickRef.current(pt.latitude, pt.longitude, utm);
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

  // ── Sync isSignedIn ref (prevents stale closure in async init) ─
  useEffect(() => {
    isSignedInRef.current = isSignedIn;
  }, [isSignedIn]);

  // ── Sync drawAOMode ref ────────────────────────────────────
  useEffect(() => {
    drawAOModeRef.current = drawAOMode;
  }, [drawAOMode]);

  // ── Sync onMapClick ref (fix stale closure bug) ────────────
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // ── Picking location → crosshair cursor ───────────────────
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.cursor = pickingLocation ? 'crosshair' : 'default';
    }
  }, [pickingLocation]);

  // ── Basemap switch (CartoDB tiles — portal BasemapGallery handles online) ─
  useEffect(() => {
    if (!mapRef.current) return;
    if (basemap === basemapRef.current) return;
    // Only switch using CartoDB basemap when not signed in
    if (!basemapGalleryRef.current) {
      mapRef.current.basemap = buildBasemap(basemap);
    }
    basemapRef.current = basemap;
  }, [basemap]);

  // ── Add BasemapGallery when user signs in ─────────────────
  useEffect(() => {
    if (!viewRef.current) return;
    if (isSignedIn && !basemapGalleryRef.current) {
      // Use the portal's configured basemap group
      const portal = new Portal({ url: PORTAL_URL });
      const gallery = new BasemapGallery({
        view: viewRef.current,
        source: { portal },
      });
      viewRef.current.ui.add(gallery, 'bottom-right');
      basemapGalleryRef.current = gallery;
    } else if (!isSignedIn && basemapGalleryRef.current) {
      viewRef.current.ui.remove(basemapGalleryRef.current);
      basemapGalleryRef.current.destroy();
      basemapGalleryRef.current = null;
      // Restore CartoDB basemap
      if (mapRef.current) mapRef.current.basemap = buildBasemap(basemapRef.current);
    }
  }, [isSignedIn]); // eslint-disable-line react-hooks/exhaustive-deps

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
        g.symbol   = makeUnitCIMSymbol(unit);
      } else {
        const g = new Graphic({
          geometry: pt,
          symbol: makeUnitCIMSymbol(unit),
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
        g.symbol   = makeIncidentCIMSymbol(inc);
      } else {
        const g = new Graphic({
          geometry: pt,
          symbol: makeIncidentCIMSymbol(inc),
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

  // ── Mission graphics — use missionPositions for random placement (Feature 5) ──
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
        g.symbol = makeMissionCIMSymbol(completed);
      } else {
        const g = new Graphic({
          geometry: pt,
          symbol: makeMissionCIMSymbol(completed),
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
  const handleUnitsToggle   = (v) => { setLocalUnitsVisible(v);     if (unitLayerRef.current) unitLayerRef.current.visible = v;     if (onUnitsVisibleChange) onUnitsVisibleChange(v); };
  const handleIncToggle     = (v) => { setLocalIncidentsVisible(v); if (incidentLayerRef.current) incidentLayerRef.current.visible = v; if (onIncidentsVisibleChange) onIncidentsVisibleChange(v); };
  const handleMissionsToggle = (v) => { setLocalMissionsVisible(v);  if (missionLayerRef.current) missionLayerRef.current.visible = v;  if (onMissionsVisibleChange) onMissionsVisibleChange(v); };
  const handleAoToggle      = (v) => { setLocalAoVisible(v);        if (aoLayerRef.current) aoLayerRef.current.visible = v;           if (onAoVisibleChange) onAoVisibleChange(v); };
  const handleSkolerToggle  = (v) => { setLocalSkolerVisible(v);    if (skolerLayerRef.current) skolerLayerRef.current.visible = v;    if (onSkolerVisibleChange) onSkolerVisibleChange(v); };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />

      {/* Feature 8: Operasjonsdata dropdown — top-left */}
      <div className="map-layer-dropdown" style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10 }}>
        <button
          className={`map-layer-dropdown-btn${opsdataOpen ? ' active' : ''}`}
          onClick={() => { setOpsdataOpen(v => !v); setKartlagOpen(false); }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
          </svg>
          Operasjonsdata
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points={opsdataOpen ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}/>
          </svg>
        </button>
        {opsdataOpen && (
          <div className="map-layer-dropdown-panel" onClick={e => e.stopPropagation()}>
            <div className="map-layer-dropdown-title">Operasjonsdata</div>
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

      {/* Feature 8: Kartlag dropdown — top-left (below Operasjonsdata) */}
      <div className="map-layer-dropdown" style={{ position: 'absolute', top: '52px', left: '10px', zIndex: 10 }}>
        <button
          className={`map-layer-dropdown-btn${kartlagOpen ? ' active' : ''}`}
          onClick={() => { setKartlagOpen(v => !v); setOpsdataOpen(false); }}
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
              <input type="checkbox" checked={localSkolerVisible} onChange={e => handleSkolerToggle(e.target.checked)} />
              🏫 Skoler og barnehager
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────

// ── Role → emoji mapping ───────────────────────────────────
const ROLE_EMOJI = {
  'Politipatrulje':   '🚓',
  'Beredskapstropp':  '🦅',
  'Taktisk team':     '🎯',
  'Kommandopost':     '📡',
  'Medisinsk enhet':  '🏥',
  'Utrykkingsenhet':  '🚑',
  'Etterretning':     '🔍',
  'Rekognosering':    '🔭',
  'Infanterienhet':   '🪖',
  'Støtteenhet':      '🪖',
  'EOD-team':         '💣',
  'EOD-støtte':       '💣',
  'Logistikk':        '🚚',
  'Flyliaison':       '🚁',
  'Flystøtte':        '🚁',
};

// ── Build a circle ring for CIMSymbol background ──────────
function buildCircleRing(radius, steps = 16) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    pts.push([radius * Math.cos(angle), radius * Math.sin(angle)]);
  }
  return pts;
}

// ── Pre-computed geometry constants ───────────────────────
const INCIDENT_SQUARE_RING = [[-11, -11], [11, -11], [11, 11], [-11, 11], [-11, -11]];
const MISSION_SQUARE_RING  = [[-7, -7],  [7, -7],  [7, 7],  [-7, 7],  [-7, -7]];

// ── CIMSymbol for units ────────────────────────────────────
function makeUnitCIMSymbol(unit) {
  const emoji = ROLE_EMOJI[unit.role] || '🪖';
  const statusColor = getStatusColorRgba(unit.status);
  return new CIMSymbol({
    data: {
      type: 'CIMSymbolReference',
      symbol: {
        type: 'CIMPointSymbol',
        symbolLayers: [
          // Background circle
          {
            type: 'CIMVectorMarker',
            enable: true,
            anchorPoint: { x: 0, y: 0 },
            anchorPointUnits: 'Relative',
            size: 24,
            frame: { xmin: -12, ymin: -12, xmax: 12, ymax: 12 },
            markerGraphics: [{
              type: 'CIMMarkerGraphic',
              geometry: { rings: [buildCircleRing(12)] },
              symbol: {
                type: 'CIMPolygonSymbol',
                symbolLayers: [
                  { type: 'CIMSolidFill',   enable: true, color: statusColor },
                  { type: 'CIMSolidStroke', enable: true, color: [255, 255, 255, 200], width: 1.5 },
                ],
              },
            }],
          },
          // Emoji text
          {
            type: 'CIMVectorMarker',
            enable: true,
            anchorPoint: { x: 0, y: 0 },
            anchorPointUnits: 'Relative',
            size: 14,
            frame: { xmin: -7, ymin: -7, xmax: 7, ymax: 7 },
            markerGraphics: [{
              type: 'CIMMarkerGraphic',
              geometry: { x: 0, y: 0 },
              symbol: {
                type: 'CIMTextSymbol',
                fontFamilyName: 'Segoe UI Emoji',
                height: 12,
                horizontalAlignment: 'Center',
                verticalAlignment: 'Center',
                symbol: { type: 'CIMPolygonSymbol', symbolLayers: [] },
              },
              textString: emoji,
            }],
          },
        ],
      },
    },
  });
}

// ── CIMSymbol for incidents ────────────────────────────────
function makeIncidentCIMSymbol(inc) {
  const emoji = inc.icon || '❗';
  const color = getPriorityColorRgba(inc.priority);
  return new CIMSymbol({
    data: {
      type: 'CIMSymbolReference',
      symbol: {
        type: 'CIMPointSymbol',
        symbolLayers: [
          // Background square
          {
            type: 'CIMVectorMarker',
            enable: true,
            anchorPoint: { x: 0, y: 0 },
            anchorPointUnits: 'Relative',
            size: 24,
            frame: { xmin: -12, ymin: -12, xmax: 12, ymax: 12 },
            markerGraphics: [{
              type: 'CIMMarkerGraphic',
              geometry: { rings: [INCIDENT_SQUARE_RING] },
              symbol: {
                type: 'CIMPolygonSymbol',
                symbolLayers: [
                  { type: 'CIMSolidFill',   enable: true, color },
                  { type: 'CIMSolidStroke', enable: true, color: [255, 255, 255, 200], width: 1.5 },
                ],
              },
            }],
          },
          // Emoji text
          {
            type: 'CIMVectorMarker',
            enable: true,
            anchorPoint: { x: 0, y: 0 },
            anchorPointUnits: 'Relative',
            size: 14,
            frame: { xmin: -7, ymin: -7, xmax: 7, ymax: 7 },
            markerGraphics: [{
              type: 'CIMMarkerGraphic',
              geometry: { x: 0, y: 0 },
              symbol: {
                type: 'CIMTextSymbol',
                fontFamilyName: 'Segoe UI Emoji',
                height: 12,
                horizontalAlignment: 'Center',
                verticalAlignment: 'Center',
                symbol: { type: 'CIMPolygonSymbol', symbolLayers: [] },
              },
              textString: emoji,
            }],
          },
        ],
      },
    },
  });
}

// ── CIMSymbol for missions ─────────────────────────────────
function makeMissionCIMSymbol(completed) {
  const color = completed ? [46, 204, 113, 200] : [231, 76, 60, 200];
  return new CIMSymbol({
    data: {
      type: 'CIMSymbolReference',
      symbol: {
        type: 'CIMPointSymbol',
        symbolLayers: [
          {
            type: 'CIMVectorMarker',
            enable: true,
            anchorPoint: { x: 0, y: 0 },
            anchorPointUnits: 'Relative',
            size: 14,
            frame: { xmin: -7, ymin: -7, xmax: 7, ymax: 7 },
            markerGraphics: [{
              type: 'CIMMarkerGraphic',
              geometry: { rings: [MISSION_SQUARE_RING] },
              symbol: {
                type: 'CIMPolygonSymbol',
                symbolLayers: [
                  { type: 'CIMSolidFill',   enable: true, color },
                  { type: 'CIMSolidStroke', enable: true, color: [255, 255, 255, 200], width: 1 },
                ],
              },
            }],
          },
          {
            type: 'CIMVectorMarker',
            enable: true,
            anchorPoint: { x: 0, y: 0 },
            anchorPointUnits: 'Relative',
            size: 10,
            frame: { xmin: -5, ymin: -5, xmax: 5, ymax: 5 },
            markerGraphics: [{
              type: 'CIMMarkerGraphic',
              geometry: { x: 0, y: 0 },
              symbol: {
                type: 'CIMTextSymbol',
                fontFamilyName: 'Segoe UI Emoji',
                height: 9,
                horizontalAlignment: 'Center',
                verticalAlignment: 'Center',
                symbol: { type: 'CIMPolygonSymbol', symbolLayers: [] },
              },
              textString: '📋',
            }],
          },
        ],
      },
    },
  });
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
