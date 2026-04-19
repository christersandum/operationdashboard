import React, { useRef, useEffect, useState } from 'react';
import Map from '@arcgis/core/Map';
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
import PopupTemplate from '@arcgis/core/PopupTemplate';
import Search from '@arcgis/core/widgets/Search';
import PortalItem from '@arcgis/core/portal/PortalItem';
import {
  SKOLER_BARNEHAGER_URL,
  SEARCH_LOCATOR_ITEM_ID,
  SEARCH_PORTAL_URL,
} from '../data';
import { wgs84ToUTM33N, utm33NToWGS84 } from '../utils/coordUtils';
import './ArcGISMap.css';

// Geodata ArcGIS basemaps (UTM33/EUREF89) — VectorTileServer
const BASEMAP_TILE_URLS = {
  dark:   'https://services.geodataonline.no/arcgis/rest/services/GeocacheVector/GeocacheGraatone/VectorTileServer',
  light:  'https://services.geodataonline.no/arcgis/rest/services/GeocacheVector/GeocacheBasis/VectorTileServer',
  kanvas: 'https://services.geodataonline.no/arcgis/rest/services/GeocacheVector/GeocacheFinlandKanvasMork/VectorTileServer',
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
  const onMapClickRef = useRef(onMapClick);
  const mapRef      = useRef(null);
  const basemapRef  = useRef(basemap);
  const isSignedInRef = useRef(isSignedIn);

  // Refs for values needed inside the init closure to avoid stale captures
  const centerRef                  = useRef(center);
  const zoomRef                    = useRef(zoom);
  const basemapInitRef             = useRef(basemap);
  const webmapIdRef                = useRef(webmapId);
  const skolerBarnehagerVisibleRef = useRef(skolerBarnehagerVisible);

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

  // ── Keep init-closure refs in sync with latest props ─────────
  useEffect(() => {
    centerRef.current                  = center;
    zoomRef.current                    = zoom;
    basemapInitRef.current             = basemap;
    webmapIdRef.current                = webmapId;
    skolerBarnehagerVisibleRef.current = skolerBarnehagerVisible;
  }, [center, zoom, basemap, webmapId, skolerBarnehagerVisible]);

  // ── Init map once ──────────────────────────────────────────
  useEffect(() => {
    // Guard against React StrictMode double-invoke: a local flag (not a ref)
    // means the second synchronous call after cleanup will also be skipped.
    let initialized = false;
    if (!mapDivRef.current || viewRef.current) return;
    initialized = true;

    // ── Skoler og barnehager FeatureLayer ────────────────────
    const skolerLayer = new FeatureLayer({
      url: SKOLER_BARNEHAGER_URL,
      id: 'skoler_barnehager',
      title: 'Skoler og barnehager',
      visible: !!skolerBarnehagerVisibleRef.current,
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
    if (webmapIdRef.current) {
      map = new WebMap({ portalItem: { id: webmapIdRef.current } });
      map.add(skolerLayer);
      map.add(aoLayer);
      map.add(missionLayer);
      map.add(incidentLayer);
      map.add(unitLayer);
    } else {
      map = new Map({
        basemap: buildBasemap(basemapInitRef.current),
        layers: [skolerLayer, aoLayer, missionLayer, incidentLayer, unitLayer],
      });
    }
    mapRef.current = map;

    // ── MapView ──────────────────────────────────────────────
    const initUTM = wgs84ToUTM33N(centerRef.current[1], centerRef.current[0]);
    const view = new MapView({
      container: mapDivRef.current,
      map: map,
      center: [initUTM.easting, initUTM.northing],
      zoom: zoomRef.current,
      spatialReference: { wkid: 25833 },
      ui: { components: ['zoom'] },
      popup: { dockEnabled: true, dockOptions: { position: 'top-right', breakpoint: false } },
    });
    viewRef.current = view;

    // ── Search widget with locator from beredskap portal ─────
    view.when(async () => {
      // Guard: bail out if the component unmounted before view was ready
      if (view.destroyed) return;

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

      if (!view.destroyed && onViewReady) onViewReady(view);
    });

    // ── Pointer move → UTM33 coords ──────────────────────────
    view.on('pointer-move', (evt) => {
      const pt = view.toMap({ x: evt.x, y: evt.y });
      if (pt && onCoordMove) {
        const utm = { easting: Math.round(pt.x), northing: Math.round(pt.y) };
        const wgs = utm33NToWGS84(pt.x, pt.y);
        onCoordMove(wgs.lat, wgs.lng, utm);
      }
    });

    // ── Map click ────────────────────────────────────────────
    view.on('click', (evt) => {
      const pt = view.toMap({ x: evt.x, y: evt.y });
      if (pt && onMapClickRef.current) {
        const utm = { easting: Math.round(pt.x), northing: Math.round(pt.y) };
        const wgs = utm33NToWGS84(pt.x, pt.y);
        onMapClickRef.current(wgs.lat, wgs.lng, utm);
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
      skolerLayerRef.current = null;
      unitLayerRef.current = null;
      incidentLayerRef.current = null;
      missionLayerRef.current = null;
      aoLayerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync isSignedIn ref (prevents stale closure in async init) ─
  useEffect(() => {
    isSignedInRef.current = isSignedIn;
  }, [isSignedIn]);

  // ── Sync onMapClick ref (fix stale closure bug) ────────────
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // ── Sync local visibility state when props change (Feature 8) ────────────
  useEffect(() => {
    setLocalUnitsVisible(unitsVisible !== false);
    setLocalIncidentsVisible(incidentsVisible !== false);
    setLocalMissionsVisible(missionsVisible !== false);
    setLocalAoVisible(aoVisible !== false);
    setLocalSkolerVisible(!!skolerBarnehagerVisible);
  }, [unitsVisible, incidentsVisible, missionsVisible, aoVisible, skolerBarnehagerVisible]);

  // ── Picking location → crosshair cursor ───────────────────
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.cursor = pickingLocation ? 'crosshair' : 'default';
    }
  }, [pickingLocation]);

  // ── Basemap switch ────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    if (webmapId) return;
    if (basemap === basemapRef.current) return;
    mapRef.current.basemap = buildBasemap(basemap);
    basemapRef.current = basemap;
  }, [basemap, webmapId]);

  // ── Fly to new center/zoom ─────────────────────────────────
  useEffect(() => {
    if (!viewRef.current) return;
    const { easting, northing } = wgs84ToUTM33N(center[1], center[0]);
    viewRef.current.goTo({ center: [easting, northing], zoom }, { animate: true, duration: 600 }).catch(() => {});
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
    const rings = [aoCoords.map(([lon, lat]) => {
      const { easting, northing } = wgs84ToUTM33N(lat, lon);
      return [easting, northing];
    })];
    const polygon = new Polygon({
      rings,
      spatialReference: { wkid: 25833 },
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
      const { easting, northing } = wgs84ToUTM33N(unit.lat, unit.lng);
      const pt = new Point({ x: easting, y: northing, spatialReference: { wkid: 25833 } });

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
      const { easting, northing } = wgs84ToUTM33N(inc.lat, inc.lng);
      const pt = new Point({ x: easting, y: northing, spatialReference: { wkid: 25833 } });

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

      const { easting, northing } = wgs84ToUTM33N(pos.lat, pos.lng);
      const pt = new Point({ x: easting, y: northing, spatialReference: { wkid: 25833 } });
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

// ── Simple marker symbol for units ────────────────────────
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

// ── Simple marker symbol for incidents ────────────────────
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

// ── Simple marker symbol for missions ─────────────────────
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
