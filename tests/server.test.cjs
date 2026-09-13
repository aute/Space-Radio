const { test } = require('node:test');
const assert = require('node:assert/strict');
const io = require('socket.io-client');
const { createRadioServer } = require('../server/server');

function event(socket, name) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out: ${name}`)), 3000);
    socket.once(name, value => { clearTimeout(timeout); resolve(value); });
  });
}

test('backend preserves playlists, the delivery radius and repeated joins', { timeout: 10000 }, async t => {
  const radio = createRadioServer({ fetchPosition: async () => ({ latitude: '0', longitude: '0' }), intervalMs: 60000 });
  await radio.listen(0, '127.0.0.1');
  t.after(() => radio.close());
  const socket = io(`http://127.0.0.1:${radio.server.address().port}`, { forceNew: true, reconnection: false });
  t.after(() => socket.close());
  await event(socket, 'connect');
  await new Promise(resolve => socket.emit('join', { lat: 0, lng: 0 }, resolve));
  // Sending before the first position must not dereference null.
  await new Promise(resolve => socket.emit('helloWorld', 'before position', resolve));
  const playlist = event(socket, 'playList');
  await radio.update();
  assert.deepEqual((await playlist).sort(), [1, 2, 3, 4].map(n => `./musicList/${n}.mp3`));
  const received = event(socket, 'hello');
  socket.emit('helloWorld', 'hello orbit');
  assert.equal((await received).text, 'hello orbit');
  // An updated location replaces the old registration rather than duplicating it.
  await new Promise(resolve => socket.emit('join', { lat: 80, lng: 0 }, resolve));
  const outsideMessages = [];
  socket.on('hello', message => outsideMessages.push(message));
  await new Promise(resolve => socket.emit('helloWorld', 'outside radius', resolve));
  assert.equal(outsideMessages.length, 0);
  await new Promise(resolve => socket.emit('join', { lat: 0, lng: 0 }, resolve));
  await new Promise(resolve => socket.emit('helloWorld', 'inside again', resolve));
  assert.equal(outsideMessages.length, 1);
  socket.close();
});

test('an unavailable ISS provider does not stop playlist delivery', { timeout: 10000 }, async t => {
  const radio = createRadioServer({ fetchPosition: async () => { throw new Error('offline'); }, intervalMs: 60000, logger: { warn() {} } });
  await radio.listen(0, '127.0.0.1');
  t.after(() => radio.close());
  const socket = io(`http://127.0.0.1:${radio.server.address().port}`, { forceNew: true, reconnection: false });
  t.after(() => socket.close());
  await event(socket, 'connect');
  const playlist = event(socket, 'playList');
  await radio.update();
  assert.equal((await playlist).length, 4);
});

test('forecast API validates input and returns recoverable provider errors', async t => {
  const orbit = { passes: async () => [{ risetime: 100, duration: 300 }] };
  const radio = createRadioServer({ orbit, intervalMs: 60000 });
  await radio.listen(0, '127.0.0.1');
  t.after(() => radio.close());
  const base = `http://127.0.0.1:${radio.server.address().port}/api/iss/passes`;
  assert.equal((await fetch(base)).status, 400);
  assert.equal((await fetch(`${base}?lat=91&lon=0`)).status, 400);
  assert.equal((await fetch(`${base}?lat=&lon=0`)).status, 400);
  const result = await fetch(`${base}?lat=0&lon=0`);
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { response: [{ risetime: 100, duration: 300 }] });
  orbit.passes = async () => { throw new Error('offline'); };
  assert.equal((await fetch(`${base}?lat=0&lon=0`)).status, 503);
});
