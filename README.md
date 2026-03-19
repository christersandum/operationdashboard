# Operation Dashboard

A real-time military/operations web dashboard inspired by ArcGIS Mission Manager.

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

## Getting Started

There is **no build step** — the dashboard is pure HTML, CSS and JavaScript with Leaflet.js bundled locally.

### Option 1 — Open directly in a browser (simplest)

```bash
# macOS
open index.html

# Windows
start index.html

# Linux
xdg-open index.html
```

### Option 2 — Serve with npm (recommended, avoids browser file-access restrictions)

```bash
npm start
```

Then open the URL shown in the terminal (e.g. `http://localhost:3000`) in any modern browser.

> **Prerequisites:** [Node.js](https://nodejs.org/) must be installed.  
> The first run will automatically download the lightweight `serve` package via `npx`.

### Option 3 — Any other static file server

```bash
# Python 3
python3 -m http.server 8080

# Node http-server
npx http-server .
```

## Hosting on GitHub Pages

Because this project is a static site with `index.html` at the repository root, it works with GitHub Pages out of the box — no build step or configuration file needed.

### Steps

1. **Push your code to GitHub** (or fork/clone this repository to your own GitHub account).

2. **Open the repository on GitHub** and go to **Settings** → **Pages** (left-hand sidebar).

3. Under **"Build and deployment"**, set the **Source** to **"Deploy from a branch"**.

4. Under **Branch**, choose **`main`** (or whichever branch holds your code) and leave the folder as **`/ (root)`**. Click **Save**.

5. After a few seconds, GitHub Pages will publish the site. A banner at the top of the Settings → Pages page will show the live URL:

   ```
   https://<your-github-username>.github.io/<repository-name>/
   ```

6. Open that URL in any browser — the Operation Dashboard will load directly.

> **Note:** GitHub Pages is free for public repositories. For private repositories it requires a paid GitHub plan.

## File Structure

```
index.html   – Main dashboard layout
styles.css   – Dark-theme stylesheet
app.js       – Map, data, and interactivity logic
lib/         – Bundled third-party libraries (Leaflet.js)
```

## Dependencies

- [Leaflet.js 1.9.4](https://leafletjs.com/) — map rendering (bundled in `lib/leaflet/`)
- [CartoDB Dark Matter tiles](https://carto.com/basemaps/) — dark map tiles (loaded from CDN at runtime)
