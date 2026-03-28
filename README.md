# Operation Dashboard

A real-time operational dashboard for emergency and tactical operations, built with React, ArcGIS Maps SDK for JavaScript, and Esri Calcite Design System.

The app loads instantly without requiring login. Signing in with an ArcGIS Online account enables cloud-backed storage of all operation data in dedicated Feature Services and a WebMap.

---

## What the app does

- **Live map** — displays unit positions, incidents, missions and the Area of Operation (AO) on a Norwegian vector tile basemap
- **Real-time unit tracking** — units move on the map as the scenario progresses
- **Incident management** — log incidents with priority, icon and map position
- **Mission management** — create missions linked to incidents and assign units
- **Chat** — operational chat log with system messages, unit messages and broadcast
- **Alerts** — sidebar alert list (warning, info, critical)
- **Save to ArcGIS Online** — creates a dedicated folder per operation with 7 Feature Services and a WebMap
- **Offline JSON export/import** — full operation state saved to / loaded from a local `.json` file
- **BasemapGallery** — when signed in, the portal's configured basemap group is available in the map

---

## Authentication

Authentication is **optional**. The app loads immediately with the built-in "Operasjon Norwegian Sword" scenario. Users can click **"Logg inn"** in the top-right corner to connect to ArcGIS Online.

### OAuth 2.0 flow

The app uses the ArcGIS Identity Manager OAuth 2.0 redirect flow against the **beredskap.maps.arcgis.com** portal.

Required environment variable:

```ini
VITE_ARCGIS_APP_ID=<your-arcgis-client-id>
```

To get a Client ID:
1. Log in to [beredskap.maps.arcgis.com](https://beredskap.maps.arcgis.com)
2. **Content → My Content → New Item → Application**
3. Open the item → **Settings → Registered Info → App ID**
4. Add redirect URIs:
   - `http://localhost:5173/operationdashboard/` (local development)
   - `https://christersandum.github.io/operationdashboard/` (production)

### Auth state

| State | Description |
|---|---|
| Not signed in | App loads with seed data. Save → JSON download only. Load → local file only. Offline basemaps (Norwegian VectorTile). |
| Signed in | Full ArcGIS Online integration. Per-operation folders created on first save. BasemapGallery from portal. |

---

## Frontend architecture

| Technology | Role |
|---|---|
| React 18 | UI component tree and state management |
| Vite | Build tool and dev server |
| ArcGIS Maps SDK for JavaScript (4.x) | Map rendering, Feature Layer queries, IdentityManager |
| Esri Calcite Design System | UI components (dialogs, buttons, lists, etc.) |

### Key components

| File | Description |
|---|---|
| `src/main.jsx` | App entry point — registers OAuth info, renders `<App>` |
| `src/App.jsx` | Root component — all app state, auth handlers, CRUD callbacks |
| `src/components/Header.jsx` | Top navigation bar — login button / user info, operation controls |
| `src/components/Sidebar.jsx` | Left panel — overview, chat, incidents, missions tabs |
| `src/components/ArcGISMap.jsx` | Map component — units, incidents, missions, AO, BasemapGallery |
| `src/components/RightPanel.jsx` | Right panel — add/edit/delete units, incidents, missions |
| `src/components/OperationPicker.jsx` | Dialog for loading operations from ArcGIS Online or local file |
| `src/data.js` | Shared constants (portal URL, skoler layer URL, incident colors, symbol library) |
| `src/utils/seedData.js` | Norwegian Sword seed data (units, incidents, missions, chat, alerts) |
| `src/utils/seedMigration.js` | First-login migration — writes seed data to ArcGIS Online |
| `src/utils/portalService.js` | Portal management — create/list operation folders and Feature Services |
| `src/utils/featureServiceSync.js` | Feature Service CRUD — single-feature and batch read/write |
| `src/utils/coordUtils.js` | Coordinate conversion between WGS84 and UTM33N (EPSG:25833) |

---

## Backend architecture (ArcGIS Online)

All persistent data is stored in the authenticated user's ArcGIS Online account.

### Folder structure

```
<username>/
└── OPS/                              ← root folder
    └── OPS — <OperationName>/        ← one subfolder per operation
        ├── OPS_Units                 ← Feature Layer (Point)
        ├── OPS_Incidents             ← Feature Layer (Point)
        ├── OPS_Missions              ← Feature Layer (Point)
        ├── OPS_AO                    ← Feature Layer (Polygon)
        ├── OPS_Operations            ← Table (no geometry)
        ├── OPS_Chat                  ← Table (no geometry)
        ├── OPS_Alerts                ← Table (no geometry)
        └── OPSMAP — <OperationName>  ← Web Map (all 4 spatial layers)
```

### Coordinate system

All Feature Services use **UTM33N / ETRS89 (EPSG:25833)**. The app converts between WGS84 (internal storage) and UTM33N for display and feature geometry.

### Data model

#### OPS_Units (Feature Layer — Point)
| Field | Type | Description |
|---|---|---|
| Operation_id | String | Links to operation |
| unit_id | String | Unique unit ID (P1, D1, etc.) |
| name | String | Display name |
| role | String | Role description |
| status | String | online / offline / opptatt |
| moving | Integer | 0/1 — is unit moving |
| assigned_incident | String | ID of assigned incident |
| incident_color_index | Integer | Color index for assigned incident |
| x_coord / y_coord | Double | UTM33 coordinates |

#### OPS_Incidents (Feature Layer — Point)
| Field | Type | Description |
|---|---|---|
| Operation_id | String | Links to operation |
| incident_id | String | Unique incident ID |
| title | String | Incident title |
| description | String | Full description |
| priority | String | low / medium / high / alarm |
| icon | String | Emoji icon |
| time | String | Reported time |
| color_index | Integer | 0–3 (for unit assignment color coding) |

#### OPS_Missions (Feature Layer — Point)
| Field | Type | Description |
|---|---|---|
| Operation_id | String | Links to operation |
| mission_id | String | Unique mission ID |
| incident_id | String | Parent incident |
| title | String | Mission title |
| description | String | Full description |
| status | String | active / completed / staged |
| assigned_unit_ids | String | Comma-separated unit IDs |

#### OPS_AO (Feature Layer — Polygon)
| Field | Type | Description |
|---|---|---|
| Operation_id | String | Links to operation |
| ao_label | String | Label shown on map |

#### OPS_Operations (Table)
| Field | Type | Description |
|---|---|---|
| Operation_id | String | Unique operation ID |
| Operation_name | String | Display name |
| center_lng / center_lat | Double | Map center |
| zoom | Integer | Initial zoom level |
| commander | String | Operation commander |
| ao_center | String | AO center coordinate string |
| progress | Integer | Progress percentage |
| elapsed | Double | Elapsed milliseconds |
| created_at / updated_at | Date | Timestamps |

#### OPS_Chat (Table)
| Field | Type | Description |
|---|---|---|
| Operation_id | String | Links to operation |
| message_id | Integer | Unique message ID |
| sender | String | Sender name |
| initials | String | Short initials or emoji |
| color | String | Hex color |
| text | String | Message text |
| is_system | Integer | 0/1 — system message |
| is_self | Integer | 0/1 — sent by current user |
| sent_at | Date | Timestamp |

#### OPS_Alerts (Table)
| Field | Type | Description |
|---|---|---|
| Operation_id | String | Links to operation |
| alert_id | String | Unique alert ID |
| text | String | Alert text |
| icon | String | Emoji icon |
| icon_bg | String | Background color (rgba) |
| icon_color | String | Icon color (hex) |
| severity | String | info / warning / critical |
| created_at | Date | Timestamp |

---

## Offline mode

The app works fully without internet access.

### Save offline
- When **not signed in**: clicking "Lagre operasjon" always downloads a JSON file
- When **signed in**: a checkbox "Lagre offline kopi" is available to also download JSON

### Load offline
- When **not signed in**: clicking "Last inn operasjon" opens a file picker for a JSON file
- When **signed in**: the OperationPicker shows both ArcGIS Online operations and a "📂 Åpne lokal fil" button

### JSON file structure
```json
{
  "operationId": "norwegian-sword",
  "operationName": "OPERASJON NORWEGIAN SWORD",
  "center": [10.741, 59.913],
  "zoom": 12,
  "commander": "Politiinspektør K. Hansen",
  "aoCenter": "59.91°N 10.74°E",
  "progress": 15,
  "elapsed": 1800000,
  "aoCoords": [[10.55, 59.97], ...],
  "aoLabel": "AO — Norwegian Sword",
  "units": [...],
  "incidents": [...],
  "missions": [...],
  "chat": [...],
  "alerts": [...]
}
```

---

## Basemaps

| Signed in | Signed out |
|---|---|
| **BasemapGallery** widget reads available basemaps from the portal's configured basemap group | Two Norwegian VectorTile basemaps (dark / light) from Geodataonline — no authentication required |

---

## Demo operation: Norwegian Sword

The app seeds "Operasjon Norwegian Sword" on first load:
- 12 units (patrols, Delta, tactical, command, medical, intelligence)
- 5 incidents that appear in a staged sequence (car fire → blocked road → explosion → assault → bank robbery)
- 13 missions linked to the incidents
- 6 chat messages
- 3 alerts

---

## Setup

### Local development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` in the project root:
   ```ini
   VITE_ARCGIS_APP_ID=your_arcgis_client_id
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

### GitHub Pages deployment

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys to GitHub Pages on every push to `main`.

Set the `VITE_ARCGIS_APP_ID` repository secret under **Settings → Secrets and variables → Actions**.

---

## File structure

```
src/
├── main.jsx                    # Entry point — OAuth registration
├── App.jsx                     # Root component — state, auth, CRUD
├── App.css                     # Global styles
├── data.js                     # Shared constants
├── components/
│   ├── Header.jsx              # Navigation bar with login button
│   ├── Sidebar.jsx             # Left panel (overview, chat, incidents)
│   ├── ArcGISMap.jsx           # Map with BasemapGallery support
│   ├── RightPanel.jsx          # Add/edit/delete units, incidents, missions
│   └── OperationPicker.jsx     # Dialog for opening operations
└── utils/
    ├── seedData.js             # Norwegian Sword seed data
    ├── seedMigration.js        # First-login migration to ArcGIS Online
    ├── portalService.js        # Per-operation folder management
    ├── featureServiceSync.js   # Feature Service CRUD
    └── coordUtils.js           # WGS84 ↔ UTM33N conversion
```

---

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| react | 18.x | UI framework |
| @arcgis/core | 4.x | ArcGIS Maps SDK |
| @arcgis/map-components | — | Map web components |
| @esri/calcite-components | — | UI design system |
| @esri/calcite-components-react | — | React wrappers |
| vite | 5.x | Build tool |
