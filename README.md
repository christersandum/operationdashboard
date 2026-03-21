# Operation Dashboard v1.1

A real-time military/operations web dashboard built with **React 18** and the **ArcGIS Maps SDK for JavaScript**, using **Esri map services** and **ArcGIS Web Components** for interactive geospatial visualization.

## Technology Stack

The application was migrated from a plain HTML/CSS/JavaScript prototype using Leaflet.js to a fully component-based React application powered by Esri's geospatial platform:

| Before (v0.x) | After (v1.x) |
|---|---|
| Plain HTML / CSS / JS | **React 18** (Hooks-based) |
| Leaflet.js + OpenStreetMap/CartoDB tiles | **ArcGIS Maps SDK for JavaScript** (`@arcgis/core` v4.32) |
| No build step — open `index.html` directly | **Vite** build tool (ES2020 target) |
| CDN script tags | **npm** package dependencies |
| Static file serving | **GitHub Pages** via CI/CD workflow |
| OpenStreetMap / CartoDB raster tiles | **Esri VectorTileLayer** with Geodataonline basemaps (dark & light) |
| No Web Components | **ArcGIS Map Components** (`@arcgis/map-components` v4.32) registered as custom elements |

## What's New in v1.1

- **Right Panel** — Collapsible CRUD panel for managing Units, Incidents, and Missions
- **Operation Management** — Save/Load/New operation state as JSON files
- **Symbol Library** — Filterable grid of 18 military/police tactical symbols
- **AO Drawing** — Click two map corners to draw a rectangle Area of Operations polygon
- **Auto-assign** — Automatically assigns the nearest free unit to unassigned missions
- **Alert Interval setting** — Configurable notification interval (default 10 s)

## Features

- **Live Map** — Dark-themed ArcGIS `MapView` (powered by Esri VectorTile services) centered on the area of operations
  - Unit position markers with real-time simulated movement (via `GraphicsLayer` + `SimpleMarkerSymbol`)
  - Incident markers color-coded by priority (`PopupTemplate` with attribute-driven styling)
  - Mission markers positioned near their assigned incident
  - Area of Operations (AO) boundary polygon drawn interactively on the map
  - Toggle layers: units, incidents, missions
  - Basemap toggle: dark / light (Geodataonline Esri VectorTile services)
- **Mission Overview** — Live statistics (active units, incidents, tasks, alerts) and recent alerts
- **Units Panel** — Searchable list of field units grouped by status (online / warning / offline). Click a unit to fly to it on the map.
- **Incidents Panel** — Filterable incident log (high / medium / low priority). Click to zoom to incident on map.
- **Missions Panel** — Active and completed missions grouped by incident, with status badges
- **Symbol Library** — Filterable grid of 18 military/police tactical symbols with category filters
- **Mission Chat** — Real-time styled chat with send/receive, system messages, and broadcast capability
- **Right Panel (CRUD)** — Add, edit, and delete Units, Incidents, and Missions with inline forms
- **Operation Management** — Save the full operation state (units, incidents, missions, chat, AO) to a JSON file; load it back or start a fresh operation
- **Live Clock** — Multi-timezone clock in the header bar (UTC, CET/CEST, EST/EDT)
- **Time Player** — Play/pause scenario simulation at 1×, 2×, or 4× speed
- **Broadcast** — Send a message to all units via the Broadcast button

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm

### Install and run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173/operationdashboard/](http://localhost:5173/operationdashboard/) in your browser.

### Build for production

```bash
npm run build
# Preview the production build locally:
npm run preview
```

The production build is output to the `dist/` folder and is deployed automatically to GitHub Pages on every push to `main`.

## Live Demo

The latest version is deployed at: **https://christersandum.github.io/operationdashboard/**

## File Structure

```
index.html              – HTML entry point (React root mount)
vite.config.js          – Vite build configuration
package.json            – npm dependencies and scripts
src/
  main.jsx              – React entry: mounts App, loads ArcGIS CSS and Web Component definitions
  App.jsx               – Root component: state, simulation engine, event handlers
  App.css               – Global dark-theme styles
  data.js               – Static operation data (units, incidents, missions, symbols, basemap URLs)
  components/
    ArcGISMap.jsx        – ArcGIS MapView wrapper (GraphicsLayer rendering, AO drawing, basemap toggle)
    Header.jsx           – Header bar: clock, basemap toggle, layer controls, Save/Load/New, settings
    Sidebar.jsx          – Left sidebar with tab navigation (Overview, Units, Incidents, Missions, Symbols, Chat)
    RightPanel.jsx       – Collapsible right panel with CRUD forms for Units, Incidents, and Missions
    tabs/
      OverviewTab.jsx    – Mission statistics and recent alerts
      UnitsTab.jsx       – Searchable, filterable unit list
      IncidentsTab.jsx   – Priority-filterable incident log
      MissionsTab.jsx    – Missions grouped by incident with status
      SymbolLibraryTab.jsx – Filterable symbol library grid
      ChatTab.jsx        – Mission chat with broadcast support
```

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | ^18.3.1 | UI framework |
| `react-dom` | ^18.3.1 | React DOM renderer |
| `@arcgis/core` | ^4.32.0 | ArcGIS Maps SDK for JavaScript (MapView, GraphicsLayer, symbols, geometry) |
| `@arcgis/map-components` | ^4.32.0 | ArcGIS Web Components (custom elements for Esri widgets) |
| `vite` | ^5.4.11 | Build tool and dev server |
| `@vitejs/plugin-react` | ^4.3.1 | Vite plugin for React/JSX support |

## Map Services

Basemap tiles are served from **Geodataonline** via **Esri VectorTileLayer**:

- **Dark basemap**: `GeocacheKanvasMork_WM` — dark canvas style for operational use
- **Light basemap**: `GeocacheGraatone_WM` — greyscale style for daytime/print use
