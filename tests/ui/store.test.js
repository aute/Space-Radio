import { describe, it, expect, vi } from 'vitest';
import { RadioStore } from '../../src/mobx/store';

function socketFixture() {
  const handlers = new Map();
  return {
    on: vi.fn((name, handler) => handlers.set(name, handler)),
    off: vi.fn((name) => handlers.delete(name)),
    connect: vi.fn(), disconnect: vi.fn(), emit: vi.fn(),
    fire: (name, data) => handlers.get(name)?.(data),
    handlers,
  };
}

describe('radio state lifecycle', () => {
  it('accepts zero coordinates and receives position even if predictions fail', async () => {
    const socket = socketFixture();
    const store = new RadioStore({ socket, locate: async () => ({ lat: 0, lng: 0 }), forecast: async () => { throw new Error('offline'); } });
    await store.start();
    socket.fire('issPositionChange', { latitude: 0, longitude: 0 });
    expect(store.ready).toBe(true);
    expect(store.distance).toBe(350);
    expect(store.error).toContain('offline');
    store.stop();
    expect(socket.handlers.size).toBe(0);
    expect(socket.disconnect).toHaveBeenCalledOnce();
  });

  it('rejoins on reconnect, tracks the active pass, and keeps only one playlist connection', async () => {
    const socket = socketFixture();
    const clock = 1000000;
    const store = new RadioStore({ socket, now: () => clock, locate: async () => ({ lat: 10, lng: 20 }), forecast: async () => [{ risetime: 990, duration: 60 }, { risetime: 2000, duration: 120 }] });
    await store.start();
    socket.fire('connect');
    expect(socket.emit).toHaveBeenLastCalledWith('join', { lat: 10, lng: 20 });
    socket.fire('issPositionChange', { latitude: 11, longitude: 20 });
    expect(store.passing).toBe(true);
    expect(store.nextPass.risetime).toBe(2000);
    socket.fire('playList', ['./musicList/1.mp3']);
    expect(store.playlist).toEqual(['./musicList/1.mp3']);
    store.stop();
  });

  it('ignores location results that arrive after unmount', async () => {
    let resolveLocation;
    const socket = socketFixture();
    const store = new RadioStore({ socket, locate: () => new Promise(resolve => { resolveLocation = resolve; }), forecast: vi.fn() });
    const starting = store.start();
    store.stop();
    resolveLocation({ lat: 1, lng: 2 });
    await starting;
    expect(socket.emit).not.toHaveBeenCalled();
    expect(store.location).toBeNull();
  });
});

describe('page-clock rehearsal', () => {
  it('jumps to ten seconds before the next pass, advances at 1x and ignores live positions', async () => {
    let clock = 1000000;
    const socket = socketFixture();
    const predict = vi.fn(async () => ({ latitude: 10, longitude: 20 }));
    const store = new RadioStore({ socket, now: () => clock, elapsedNow: () => clock, predict,
      locate: async () => ({ lat: 10, lng: 20 }), forecast: async () => [{ risetime: 2000, duration: 120 }] });
    await store.start();
    socket.fire('issPositionChange', { latitude: -10, longitude: -20 });
    await store.startPreview();
    expect(store.time).toBe(1990000);
    expect(store.passing).toBe(false);
    expect(store.distance).toBe(350);
    socket.fire('issPositionChange', { latitude: 60, longitude: 60 });
    expect(store.position.latitude).toBe(10);
    clock += 10000;
    store.tick();
    expect(store.time).toBe(2000000);
    expect(store.passing).toBe(true);
    store.restoreLive();
    expect(store.time).toBe(clock);
    expect(store.position.latitude).toBe(60);
    store.stop();
  });

  it('does not invent a pass and ignores a prediction finishing after restore', async () => {
    const socket = socketFixture();
    let resolve;
    const store = new RadioStore({ socket, now: () => 1000000, predict: () => new Promise(done => { resolve = done; }),
      locate: async () => ({ lat: 0, lng: 0 }), forecast: async () => [] });
    await store.start();
    await store.startPreview();
    expect(store.preview).toBeNull();
    expect(store.previewError).toBeTruthy();
    store.passes = [{ risetime: 2000, duration: 60 }];
    const pending = store.startPreview();
    store.restoreLive();
    resolve({ latitude: 1, longitude: 1 });
    await pending;
    expect(store.preview).toBeNull();
    store.stop();
  });
});

it('uses elapsed time and cancels in-flight preview updates on unmount', async () => {
  let real = 1000000;
  let elapsed = 0;
  let finish;
  let count = 0;
  const store = new RadioStore({ socket: socketFixture(), now: () => real, elapsedNow: () => elapsed,
    locate: async () => ({ lat: 0, lng: 0 }), forecast: async () => [{ risetime: 2000, duration: 60 }],
    predict: () => ++count === 1 ? Promise.resolve({ latitude: 0, longitude: 0 }) : new Promise(resolve => { finish = resolve; }) });
  await store.start();
  await store.startPreview();
  real += 10000000;
  elapsed += 2500;
  store.tick();
  expect(store.time).toBe(1992500);
  store.tick();
  expect(count).toBe(2);
  store.stop();
  finish({ latitude: 55, longitude: 55 });
  await Promise.resolve();
  expect(store.preview).toBeNull();
  expect(store.position).toBeNull();
});

it('uses the shared page clock to expose audio pass progress in rehearsal', async () => {
  let clock = 1000000;
  const store = new RadioStore({ socket: socketFixture(), now: () => clock, elapsedNow: () => clock,
    locate: async () => ({ lat: 0, lng: 0 }), forecast: async () => [{ risetime: 2000, duration: 120 }],
    predict: async () => ({ latitude: 0, longitude: 0 }) });
  await store.start();
  await store.startPreview();
  expect(store.passProgress).toBeNull();
  clock += 10000;
  store.tick();
  expect(store.passProgress).toBe(0);
  clock += 30000;
  store.tick();
  expect(store.passProgress).toBe(0.25);
  store.stop();
});

it('starts the offscreen entrance ten seconds before the pass without advancing reception', async () => {
  let clock = 1989000;
  const socket = socketFixture();
  const store = new RadioStore({ socket, now: () => clock,
    locate: async () => ({ lat: 0, lng: 0 }), forecast: async () => [{ risetime: 2000, duration: 120 }] });
  await store.start();
  socket.fire('connect');
  expect(store.visualPass).toBeUndefined();
  clock = 1990000; store.tick();
  expect(store.visualPass.risetime).toBe(2000);
  expect(store.passing).toBe(false);
  expect(store.passProgress).toBeNull();
  clock = 2120000; store.tick();
  expect(store.visualPass).toBeUndefined();
  store.stop();
});

it('pins Farewell in rehearsal despite live playlist updates and restores live selection', () => {
  const store = new RadioStore({ socket: socketFixture() });
  store.onPlaylist(['./musicList/2.mp3', './musicList/1.mp3']);
  expect(store.audioPlaylist).toEqual(store.playlist);
  store.preview = { time: 1000000, anchor: 1 };
  expect(store.audioPlaylist).toEqual(['./musicList/1.mp3']);
  store.onPlaylist(['./musicList/3.mp3', './musicList/1.mp3']);
  expect(store.audioPlaylist).toEqual(['./musicList/1.mp3']);
  store.restoreLive();
  expect(store.audioPlaylist).toEqual(['./musicList/3.mp3', './musicList/1.mp3']);
});
