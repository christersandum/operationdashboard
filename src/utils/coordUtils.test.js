import { describe, it, expect } from 'vitest';
import { wgs84ToUTM33N, utm33NToWGS84, formatUTM33 } from './coordUtils';

describe('wgs84ToUTM33N', () => {
  it('converts Oslo city centre correctly', () => {
    const result = wgs84ToUTM33N(59.913, 10.741);
    expect(result.easting).toBeGreaterThan(250000);
    expect(result.easting).toBeLessThan(270000);
    expect(result.northing).toBeGreaterThan(6630000);
    expect(result.northing).toBeLessThan(6650000);
  });

  it('round-trips WGS84 → UTM33N → WGS84 within 5m', () => {
    const lat = 59.913, lng = 10.741;
    const utm = wgs84ToUTM33N(lat, lng);
    const back = utm33NToWGS84(utm.easting, utm.northing);
    // Rounding to nearest metre in UTM introduces up to ~5m error in round-trip
    expect(Math.abs(back.lat - lat)).toBeLessThan(0.00005);
    expect(Math.abs(back.lng - lng)).toBeLessThan(0.0001);
  });
});

describe('formatUTM33', () => {
  it('returns dash for null input', () => {
    expect(formatUTM33(null)).toBe('—');
  });

  it('formats valid UTM33 coords', () => {
    const result = formatUTM33({ easting: 262000, northing: 6643000 });
    expect(result).toMatch(/Ø/);
    expect(result).toMatch(/N/);
  });
});
