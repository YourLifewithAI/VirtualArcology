/**
 * Location services for location-aware sites, all free/keyless and callable
 * straight from the browser: Nominatim (OSM) for geocoding, Open-Meteo for
 * climate normals and elevation. Everything degrades gracefully offline —
 * the app never depends on these.
 */

export interface GeoLocation {
  label: string;
  lat: number;
  lon: number;
}

export interface Climate {
  /** annual mean temperature, °C */
  tMeanC: number;
  /** annual precipitation, mm */
  precipMm: number;
}

/** Accepts "30.27, -97.74" directly, otherwise geocodes via Nominatim. */
export async function geocode(query: string): Promise<GeoLocation | null> {
  const coords = query.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (coords) {
    const lat = parseFloat(coords[1]);
    const lon = parseFloat(coords[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return { label: `${lat.toFixed(3)}, ${lon.toFixed(3)}`, lat, lon };
    }
    return null;
  }
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
    { headers: { Accept: 'application/json' } },
  );
  if (!res.ok) throw new Error(`geocoder: HTTP ${res.status}`);
  const hits = (await res.json()) as { display_name: string; lat: string; lon: string }[];
  if (!hits.length) return null;
  const h = hits[0];
  // keep the label short: first two comma parts
  const label = h.display_name.split(',').slice(0, 2).join(',').trim();
  return { label, lat: parseFloat(h.lat), lon: parseFloat(h.lon) };
}

/** One full recent year of daily ERA5 reanalysis → annual mean temp + precip. */
export async function fetchClimate(lat: number, lon: number): Promise<Climate> {
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
    `&start_date=2024-01-01&end_date=2024-12-31&daily=temperature_2m_mean,precipitation_sum&timezone=UTC`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`climate: HTTP ${res.status}`);
  const data = (await res.json()) as { daily?: { temperature_2m_mean: (number | null)[]; precipitation_sum: (number | null)[] } };
  const temps = (data.daily?.temperature_2m_mean ?? []).filter((v): v is number => v !== null);
  const precs = (data.daily?.precipitation_sum ?? []).filter((v): v is number => v !== null);
  if (!temps.length) throw new Error('climate: empty response');
  return {
    tMeanC: temps.reduce((a, b) => a + b, 0) / temps.length,
    precipMm: precs.reduce((a, b) => a + b, 0),
  };
}

/** Map climate normals onto the app's regional archetypes (Köppen-ish). */
export function classifyBiome(c: Climate): { biome: string; label: string } {
  if (c.tMeanC < 3) return { biome: 'tundra', label: 'subpolar / alpine' };
  if (c.precipMm < 260) return { biome: 'desert', label: 'arid' };
  if (c.precipMm < 560) return { biome: 'plains', label: 'semi-arid steppe' };
  return { biome: 'temperate', label: c.tMeanC > 18 ? 'warm temperate' : 'temperate' };
}

/**
 * n×n elevation grid (meters) over span×span meters centered on lat/lon,
 * normalized so the center (pad grade) is 0. Batched ≤100 points per call.
 */
export async function fetchElevationGrid(lat: number, lon: number, n = 21, span = 6400): Promise<number[]> {
  const mPerLat = 111_320;
  const mPerLon = 111_320 * Math.cos((lat * Math.PI) / 180);
  const pts: { la: number; lo: number }[] = [];
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1) - 0.5) * span;
      const z = (j / (n - 1) - 0.5) * span;
      // world +z = south in-app; latitude decreases southward
      pts.push({ la: lat - z / mPerLat, lo: lon + x / mPerLon });
    }
  }
  const heights: number[] = [];
  for (let off = 0; off < pts.length; off += 100) {
    const batch = pts.slice(off, off + 100);
    const url =
      `https://api.open-meteo.com/v1/elevation?latitude=${batch.map((p) => p.la.toFixed(5)).join(',')}` +
      `&longitude=${batch.map((p) => p.lo.toFixed(5)).join(',')}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`elevation: HTTP ${res.status}`);
    const data = (await res.json()) as { elevation: number[] };
    heights.push(...data.elevation);
  }
  // pad grade = mean of the central 3×3
  const mid = Math.floor(n / 2);
  let grade = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) grade += heights[(mid + j) * n + (mid + i)];
  grade /= 9;
  return heights.map((h) => Math.min(400, Math.max(-250, h - grade)));
}
