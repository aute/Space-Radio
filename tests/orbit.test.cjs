const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createOrbitService } = require('../server/orbit');

// Recorded orbital elements are fixtures only; production always fetches fresh data.
const tle = 'ISS (ZARYA)\n1 25544U 98067A   26256.17555434  .00004898  00000+0  96695-4 0  9992\n2 25544  51.6307 224.6171 0004917 134.6730 225.4659 15.49096932585393';
const now = Date.parse('2026-09-13T17:00:00Z');

test('fresh TLE data provides positions and ordered ten-degree passes', async () => {
  let requests = 0;
  const orbit = createOrbitService({ now: () => now, fetchTle: async () => { requests++; return tle; } });
  const position = await orbit.position();
  assert.ok(Math.abs(position.latitude) <= 52);
  assert.ok(Math.abs(position.longitude) <= 180);
  const passes = await orbit.passes(31.17, 121.45);
  assert.equal(passes.length, 5);
  for (const [index, pass] of passes.entries()) {
    assert.ok(pass.duration > 0 && pass.duration < 1200);
    assert.ok(pass.risetime + pass.duration > now / 1000);
    if (index) assert.ok(pass.risetime > passes[index - 1].risetime + passes[index - 1].duration);
    // Independently check the elevation just inside and outside each crossing.
    assert.ok(await orbit.elevation(31.17, 121.45, (pass.risetime + 2) * 1000) > 10);
    assert.ok(await orbit.elevation(31.17, 121.45, (pass.risetime - 2) * 1000) < 10);
  }
  assert.equal(requests, 1);
});

test('invalid coordinates and stale orbital elements are rejected', async () => {
  const orbit = createOrbitService({ now: () => now + 10 * 86400000, fetchTle: async () => tle });
  await assert.rejects(orbit.position(), /stale/i);
  await assert.rejects(orbit.passes(91, 0), /coordinates/i);
});

test('a current pass retains its actual rise time when opened midway through it', async () => {
  let clock = now;
  const orbit = createOrbitService({ now: () => clock, fetchTle: async () => tle });
  const [first] = await orbit.passes(31.17, 121.45);
  clock = (first.risetime + first.duration / 2) * 1000;
  const [active] = await orbit.passes(31.17, 121.45);
  assert.ok(Math.abs(active.risetime - first.risetime) <= 1);
});

test('rehearsal propagation uses the requested date without moving the service clock', async () => {
  const orbit = createOrbitService({ now: () => now, fetchTle: async () => tle });
  const live = await orbit.position();
  const future = await orbit.position(now + 3600000);
  assert.equal(future.timestamp, (now + 3600000) / 1000);
  assert.notEqual(future.longitude, live.longitude);
  assert.deepEqual(await orbit.position(), live);
});
