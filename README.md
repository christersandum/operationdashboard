# Operation Dashboard v1.1

A real-time military/operations web dashboard inspired by ArcGIS Mission Manager.

## What's New in v1.1

- **Right Panel** — Collapsible CRUD panel for managing Units, Incidents, and Missions
- **Operation Management** — Save/Load/New operation state as JSON files
- **Symbol Library** — Filterable grid of 18 military/police tactical symbols
- **AO Drawing** — Click two map corners to draw a rectangle Area of Operations polygon
- **Auto-assign** — Automatically assigns the nearest free unit to unassigned missions
- **Alert Interval setting** — Configurable notification interval (default 10 s)

## Features

- **Live Map** — Dark-themed interactive map (Leaflet.js + OpenStreetMap/CartoDB) centered on the area of operations
  - Unit position markers with real-time simulated movement
  - Incident markers color-coded by priority
  - Area of Operations (AO) boundary polygon
  - Toggle layers: units, incidents, grid, heatmap
  - Measure tool
- **Mission Overview** — Live statistics (active units, incidents, tasks, alerts), mission progress bar, and recent alerts
- **Units Panel** — Searchable list of field units grouped by status (online / warning / offline) with signal strength display. Click a unit to fly to it on the map.
- **Incidents Panel** — Filterable incident log (high / medium / low priority). Click to zoom to incident on map.
- **Mission Chat** — Real-time styled chat with send/receive, system messages, and broadcast capability
- **Live Clock** — UTC clock in the header bar
- **Broadcast** — Send a message to all units via the Broadcast button

## Usage

Open `index.html` directly in any modern browser — no build step or server required.

```
open index.html
# or serve locally:
npx serve .
```

## File Structure

```
index.html   – Main dashboard layout
styles.css   – Dark-theme stylesheet
app.js       – Map, data, and interactivity logic
```

## Dependencies (CDN)

- [Leaflet.js 1.9.4](https://leafletjs.com/) — map rendering
- [CartoDB Dark Matter tiles](https://carto.com/basemaps/) — dark map tiles
