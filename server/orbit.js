const satellite = require('satellite.js');
const { validCoordinates } = require('../shared/radio.cjs');
const DAY = 86400000;

async function downloadTle() {
  const urls = [
    'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE',
    'https://api.wheretheiss.at/v1/satellites/25544/tles',
  ];
  for (const [index, url] of urls.entries()) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(`Orbital provider returned ${response.status}`);
      if (index === 0) return await response.text();
      const data = await response.json();
      return `${data.line1}\n${data.line2}`;
    } catch (error) {
      if (index === urls.length - 1) throw error;
    }
  }
}

function createOrbitService({ now = Date.now, fetchTle = downloadTle } = {}) {
  let record;
  let epoch = 0;
  let refreshed = 0;
  let pending;
  let retryAfter = 0;
  let lastError;
  const forecasts = new Map();

  async function getRecord() {
    const fresh = () => record && Math.abs(now() - epoch) < 7 * DAY;
    if (fresh() && (now() - refreshed < 6 * 3600000 || now() < retryAfter)) return record;
    if (!fresh() && now() < retryAfter && lastError) throw lastError;
    if (!pending) pending = (async () => {
      try {
        const lines = (await fetchTle()).trim().split(/\r?\n/);
        const line1 = lines.find(line => line.startsWith('1 25544'));
        const line2 = lines.find(line => line.startsWith('2 25544'));
        if (!line1 || !line2) throw new Error('Invalid ISS orbital elements');
        const next = satellite.twoline2satrec(line1, line2);
        const nextEpoch = (next.jdsatepoch - 2440587.5) * DAY;
        if (!Number.isFinite(nextEpoch) || Math.abs(now() - nextEpoch) >= 7 * DAY) {
          throw new Error('ISS orbital elements are stale');
        }
        if (next.error || !satellite.propagate(next, new Date(now()))) throw new Error('Invalid ISS orbit');
        record = next;
        epoch = nextEpoch;
        refreshed = now();
        forecasts.clear();
      } catch (error) {
        lastError = error;
        retryAfter = now() + 60000;
        // A temporarily unavailable provider may use its last still-valid elements.
        if (!fresh()) throw error;
      } finally {
        pending = null;
      }
      return record;
    })();
    return pending;
  }

  function propagate(record, time) {
    const value = satellite.propagate(record, new Date(time));
    if (!value) throw new Error('ISS propagation failed');
    return value.position;
  }

  function elevationAt(record, lat, lng, time) {
    const ecf = satellite.eciToEcf(propagate(record, time), satellite.gstime(new Date(time)));
    const observer = { latitude: lat * Math.PI / 180, longitude: lng * Math.PI / 180, height: 0 };
    return satellite.ecfToLookAngles(observer, ecf).elevation * 180 / Math.PI;
  }

  return {
    async position() {
      const record = await getRecord();
      const time = now();
      const gd = satellite.eciToGeodetic(propagate(record, time), satellite.gstime(new Date(time)));
      return { latitude: satellite.degreesLat(gd.latitude), longitude: satellite.degreesLong(gd.longitude), timestamp: Math.floor(time / 1000) };
    },
    async elevation(lat, lng, time) { return elevationAt(await getRecord(), lat, lng, time); },
    async passes(lat, lng) {
      if (!validCoordinates(lat, lng)) throw new Error('Invalid coordinates');
      const record = await getRecord();
      const time = now();
      const key = `${lat},${lng}`;
      const cached = forecasts.get(key);
      if (cached && time - cached.created < 60000 && cached.passes.every(pass => (pass.risetime + pass.duration) * 1000 > time)) return cached.passes;
      const inside = value => elevationAt(record, lat, lng, value) >= 10;
      const crossing = (left, right, wasInside) => {
        while (right - left > 500) {
          const middle = (left + right) / 2;
          if (inside(middle) === wasInside) left = middle; else right = middle;
        }
        return Math.round((left + right) / 2000);
      };
      // Open Notify defined a pass as elevation >= 10°. Search backward too so
      // opening the page during a pass does not lose its original rise time.
      const start = time - 20 * 60000;
      let previous = inside(start);
      let rise = previous ? Math.floor(start / 1000) : null;
      const passes = [];
      for (let cursor = start + 10000; cursor <= time + 2 * DAY && passes.length < 5; cursor += 10000) {
        const current = inside(cursor);
        if (current !== previous) {
          const boundary = crossing(cursor - 10000, cursor, previous);
          if (current) rise = boundary;
          else if (rise !== null && boundary * 1000 > time) passes.push({ risetime: rise, duration: boundary - rise });
          previous = current;
        }
      }
      if (forecasts.size >= 100) forecasts.delete(forecasts.keys().next().value);
      forecasts.set(key, { created: time, passes });
      return passes;
    },
  };
}

module.exports = { createOrbitService };
