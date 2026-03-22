/* ============================================================
   coordUtils.js — Coordinate conversion utilities
   WGS84 ↔ UTM33N ETRS89 (EPSG:25833)
   Based on the Karney/Krüger transverse Mercator series
   ============================================================ */

// GRS80 ellipsoid parameters (ETRS89 uses GRS80, essentially same as WGS84)
const A_GRS80 = 6378137.0;
const F_GRS80 = 1.0 / 298.257222101;

// UTM zone 33N parameters
const K0     = 0.9996;
const LON0   = 15.0 * (Math.PI / 180); // central meridian 15°E
const FE     = 500000.0;               // false easting
const FN     = 0.0;                    // false northing (northern hemisphere)

/**
 * Convert WGS84/ETRS89 latitude,longitude to UTM33N easting,northing
 * @param {number} latDeg  Latitude in decimal degrees
 * @param {number} lngDeg  Longitude in decimal degrees
 * @returns {{ easting: number, northing: number }} rounded to nearest metre
 */
export function wgs84ToUTM33N(latDeg, lngDeg) {
  const f  = F_GRS80;
  const n  = f / (2 - f);
  const A  = (A_GRS80 / (1 + n)) * (1 + n * n / 4 + n * n * n * n / 64);

  const lat = latDeg * (Math.PI / 180);
  const lon = lngDeg * (Math.PI / 180);
  const dLon = lon - LON0;

  // Conformal latitude via Bowring-Helmert formula
  const e2   = 2 * f - f * f;
  const sinL = Math.sin(lat);
  const t    = Math.sinh(Math.atanh(sinL) - (2 * Math.sqrt(n) / (1 + n)) * Math.atanh((2 * Math.sqrt(n) / (1 + n)) * sinL));

  const xi  = Math.atan2(t, Math.cos(dLon));
  const eta = Math.atanh(Math.sin(dLon) / Math.sqrt(1 + t * t));

  // Krüger series coefficients (3 terms, accurate to sub-mm for Norway)
  const a1 = n / 2 - 2 * n * n / 3 + 37 * n * n * n / 96;
  const a2 = n * n / 48 + n * n * n / 15;
  const a3 = 17 * n * n * n / 480;

  const xiP  = xi  + a1 * Math.sin(2 * xi) * Math.cosh(2 * eta)
                   + a2 * Math.sin(4 * xi) * Math.cosh(4 * eta)
                   + a3 * Math.sin(6 * xi) * Math.cosh(6 * eta);
  const etaP = eta + a1 * Math.cos(2 * xi) * Math.sinh(2 * eta)
                   + a2 * Math.cos(4 * xi) * Math.sinh(4 * eta)
                   + a3 * Math.cos(6 * xi) * Math.sinh(6 * eta);

  const easting  = FE + K0 * A * etaP;
  const northing = FN + K0 * A * xiP;

  return { easting: Math.round(easting), northing: Math.round(northing) };
}

/**
 * Convert UTM33N easting,northing to WGS84/ETRS89 latitude,longitude
 * @param {number} easting  Easting in metres
 * @param {number} northing Northing in metres
 * @returns {{ lat: number, lng: number }} in decimal degrees
 */
export function utm33NToWGS84(easting, northing) {
  const f = F_GRS80;
  const n = f / (2 - f);
  const A = (A_GRS80 / (1 + n)) * (1 + n * n / 4 + n * n * n * n / 64);

  const e2 = 2 * f - f * f;

  const xi  = (northing - FN) / (K0 * A);
  const eta = (easting  - FE) / (K0 * A);

  // Inverse Krüger series coefficients
  const b1 = n / 2 - 2 * n * n / 3 + 37 * n * n * n / 96;
  const b2 = n * n / 48 + n * n * n / 15;
  const b3 = 17 * n * n * n / 480;

  const xiP  = xi  - b1 * Math.sin(2 * xi) * Math.cosh(2 * eta)
                   - b2 * Math.sin(4 * xi) * Math.cosh(4 * eta)
                   - b3 * Math.sin(6 * xi) * Math.cosh(6 * eta);
  const etaP = eta - b1 * Math.cos(2 * xi) * Math.sinh(2 * eta)
                   - b2 * Math.cos(4 * xi) * Math.sinh(4 * eta)
                   - b3 * Math.cos(6 * xi) * Math.sinh(6 * eta);

  const lon = LON0 + Math.atan2(Math.sinh(etaP), Math.cos(xiP));

  // Conformal to geographic latitude (series solution)
  const chi = Math.asin(Math.sin(xiP) / Math.cosh(etaP));
  let lat = chi
    + (3 * n / 2 - 27 * n * n * n / 32) * Math.sin(2 * chi)
    + (21 * n * n / 16 - 55 * n * n * n * n / 32) * Math.sin(4 * chi)
    + (151 * n * n * n / 96) * Math.sin(6 * chi);

  // Iterative refinement (3 iterations is sufficient for <0.01 m accuracy)
  const sqrtN = 2 * Math.sqrt(n) / (1 + n);
  for (let i = 0; i < 3; i++) {
    const eccCorr = Math.atanh(Math.sqrt(e2) * Math.sin(lat));
    const sinChi  = Math.tanh(Math.atanh(Math.sin(chi)) + sqrtN * eccCorr);
    lat = Math.asin(sinChi);
  }

  return {
    lat: lat * (180 / Math.PI),
    lng: lon * (180 / Math.PI),
  };
}

/**
 * Format UTM33N coordinates for display (Norwegian style with thousand separators)
 * @param {{ easting: number, northing: number }|null} utm
 * @returns {string}
 */
export function formatUTM33(utm) {
  if (!utm) return '—';
  const fmtE = utm.easting.toLocaleString('nb-NO');
  const fmtN = utm.northing.toLocaleString('nb-NO');
  return `Ø ${fmtE}  N ${fmtN}`;
}
