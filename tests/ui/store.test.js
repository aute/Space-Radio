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
