import { afterEach, it, expect, vi } from 'vitest';
import { AudioController } from '../../src/audio/controller';
import { audioLevels } from '../../shared/radio.cjs';

afterEach(() => vi.useRealTimers());

function fixture() {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  const players = [];
  const volume = () => ({ value: 0, rampTo: vi.fn() });
  const noise = { start: vi.fn(), dispose: vi.fn(), volume: volume(), setReception: vi.fn() };
  const music = { dispose: vi.fn(), volume: volume() };
  const adapter = {
    now: () => Date.now() / 1000,
    schedule: (fn, seconds) => setTimeout(fn, seconds * 1000),
    cancel: clearTimeout,
    unlock: vi.fn(async () => {}), createNoise: () => noise, createMusicBus: () => music,
    createPlayer: onstop => {
      let timer;
      const player = {
        buffer: { duration: 10 }, fadeIn: 0, fadeOut: 0,
        load: vi.fn(async () => {}),
        start: vi.fn(time => { timer = setTimeout(onstop, (time + player.buffer.duration - adapter.now()) * 1000); }),
        stop: vi.fn(time => { clearTimeout(timer); timer = setTimeout(onstop, (time + player.fadeOut - adapter.now()) * 1000); }),
        dispose: vi.fn(() => clearTimeout(timer)), onstop,
      };
      players.push(player);
      return player;
    },
  };
  return { engine: new AudioController(adapter, () => 0), adapter, players, noise, music };
}

it('keeps the original distance-volume curve', () => {
  expect(audioLevels(2250)).toEqual({ covered: false, noise: -20, music: -Infinity });
  expect(audioLevels(null).covered).toBe(false);
  expect(audioLevels(2190).noise).toBe(-21);
  expect(audioLevels(1125).music).toBeCloseTo(-(2 + 40 / 4096));
});

it('preloads a successor and overlaps it on the audio clock before the current track ends', async () => {
  const { engine, adapter, players } = fixture();
  engine.update(1000, ['a', 'b']);
  expect(adapter.unlock).not.toHaveBeenCalled();
  await engine.start();
  await vi.advanceTimersByTimeAsync(100);
  expect(players).toHaveLength(2);
  expect(players[0].load).toHaveBeenCalledWith('a');
  expect(players[1].load).toHaveBeenCalledWith('b');
  const firstStart = players[0].start.mock.calls[0][0];
  const secondStart = players[1].start.mock.calls[0][0];
  expect(secondStart).toBeGreaterThan(firstStart);
  expect(secondStart).toBeLessThan(firstStart + 10);
  await vi.advanceTimersByTimeAsync(11000);
  expect(players[0].dispose).toHaveBeenCalledOnce();
  expect(players.filter(player => !player.dispose.mock.calls.length)).toHaveLength(2);
  engine.dispose();
  await vi.advanceTimersByTimeAsync(1000);
  expect(players.every(player => player.dispose.mock.calls.length === 1)).toBe(true);
});

it('ramps gain, cancels future audio, and fades a playing track on coverage exit', async () => {
  const { engine, players, noise, music } = fixture();
  engine.update(1000, ['a', 'b']);
  await engine.start();
  await vi.advanceTimersByTimeAsync(100);
  engine.update(3000, ['a', 'b']);
  expect(music.volume.rampTo).toHaveBeenLastCalledWith(-200, expect.any(Number));
  expect(noise.volume.rampTo).toHaveBeenLastCalledWith(-20, expect.any(Number));
  expect(players[0].stop).toHaveBeenCalledOnce();
  expect(players[0].dispose).not.toHaveBeenCalled();
  expect(players[1].dispose).toHaveBeenCalledOnce();
  await vi.advanceTimersByTimeAsync(1000);
  expect(players[0].dispose).toHaveBeenCalledOnce();
  engine.dispose();
  await vi.advanceTimersByTimeAsync(1000);
  expect(vi.getTimerCount()).toBe(0);
});

it('ignores downloads completed after leaving coverage', async () => {
  const { engine, adapter, players } = fixture();
  let finish;
  const original = adapter.createPlayer;
  adapter.createPlayer = onstop => {
    const player = original(onstop);
    player.load = () => new Promise(resolve => { finish = resolve; });
    return player;
  };
  engine.update(1000, ['a']);
  await engine.start();
  engine.update(3000, ['a']);
  finish();
  await vi.advanceTimersByTimeAsync(1000);
  expect(players[0].start).not.toHaveBeenCalled();
  expect(players[0].dispose).toHaveBeenCalledOnce();
  engine.dispose();
  await vi.advanceTimersByTimeAsync(1000);
});

it('coalesces concurrent starts', async () => {
  const { engine, adapter, noise } = fixture();
  await Promise.all([engine.start(), engine.start()]);
  expect(adapter.unlock).toHaveBeenCalledOnce();
  expect(noise.start).toHaveBeenCalledOnce();
  engine.dispose();
  await vi.advanceTimersByTimeAsync(1000);
});

it('skips a failed download without spinning or interrupting the healthy successor', async () => {
  const { engine, adapter, players } = fixture();
  const create = adapter.createPlayer;
  adapter.createPlayer = onstop => {
    const player = create(onstop);
    player.load = vi.fn(async url => { if (url === 'bad') throw new Error('offline'); });
    return player;
  };
  engine.update(1000, ['bad', 'good']);
  await engine.start();
  await vi.advanceTimersByTimeAsync(100);
  expect(players[0].dispose).toHaveBeenCalledOnce();
  expect(players[1].load).toHaveBeenCalledWith('good');
  expect(players[1].start).toHaveBeenCalledOnce();
  expect(players.length).toBeLessThan(5);
  engine.dispose();
  await vi.advanceTimersByTimeAsync(1000);
});

it('allows a retry after node initialization fails', async () => {
  const { engine, adapter, music } = fixture();
  const create = adapter.createNoise;
  adapter.createNoise = () => { throw new Error('device unavailable'); };
  await expect(engine.start()).rejects.toThrow('device unavailable');
  expect(engine.started).toBe(false);
  expect(music.dispose).toHaveBeenCalledOnce();
  adapter.createNoise = create;
  await engine.start();
  expect(engine.started).toBe(true);
  engine.dispose();
  await vi.advanceTimersByTimeAsync(1000);
});

it('bounds retries when every track fails and cancels retries on disposal', async () => {
  const { engine, adapter, players } = fixture();
  const create = adapter.createPlayer;
  adapter.createPlayer = onstop => {
    const player = create(onstop);
    player.load = async () => { throw new Error('offline'); };
    return player;
  };
  engine.update(1000, ['a', 'b']);
  await engine.start();
  await vi.advanceTimersByTimeAsync(4900);
  expect(players).toHaveLength(2);
  await vi.advanceTimersByTimeAsync(6000);
  expect(players).toHaveLength(4);
  engine.dispose();
  await vi.advanceTimersByTimeAsync(1000);
  expect(vi.getTimerCount()).toBe(0);
});

it('waits for the outgoing source on rapid reentry and never stacks more than two players', async () => {
  const { engine, players } = fixture();
  engine.update(1000, ['a', 'b']);
  await engine.start();
  await vi.advanceTimersByTimeAsync(100);
  engine.update(3000, ['a', 'b']);
  engine.update(1000, ['a', 'b']);
  expect(players).toHaveLength(2);
  await vi.advanceTimersByTimeAsync(1000);
  expect(players.filter(player => !player.dispose.mock.calls.length)).toHaveLength(2);
  expect(players[1].dispose).toHaveBeenCalledOnce();
  engine.dispose();
  await vi.advanceTimersByTimeAsync(1000);
});

it('removes a queued track when the playlist changes and handles an empty playlist', async () => {
  const { engine, players } = fixture();
  engine.update(1000, ['a', 'b']);
  await engine.start();
  await vi.advanceTimersByTimeAsync(100);
  engine.update(1000, ['a', 'c']);
  await vi.advanceTimersByTimeAsync(100);
  expect(players[1].dispose).toHaveBeenCalledOnce();
  expect(players[2].load).toHaveBeenCalledWith('c');
  engine.update(1000, []);
  await vi.advanceTimersByTimeAsync(11000);
  expect(players.every(player => player.dispose.mock.calls.length === 1)).toBe(true);
  engine.dispose();
  await vi.advanceTimersByTimeAsync(1000);
});

it('avoids an immediate repeat across shuffle cycles', async () => {
  const { engine, players } = fixture();
  engine.random = () => 0.99;
  engine.update(1000, ['a', 'b', 'c']);
  await engine.start();
  await vi.advanceTimersByTimeAsync(35000);
  const urls = players.map(player => player.load.mock.calls[0][0]);
  expect(new Set(urls.slice(0, 3)).size).toBe(3);
  expect(urls.every((url, i) => !i || url !== urls[i - 1])).toBe(true);
  engine.dispose();
  await vi.advanceTimersByTimeAsync(1000);
});

it('keeps the lead-in noisy and opens reception over the first quarter of a pass', () => {
  const lead = audioLevels(1400, null);
  const entry = audioLevels(1400, 0);
  const early = audioLevels(1400, 0.1);
  const clear = audioLevels(1400, 0.25);
  expect(lead.noise).toBe(-20);
  expect(lead.music).toBe(-22);
  expect(entry).toEqual(lead);
  expect(early.music).toBeGreaterThan(-22);
  expect(early.music).toBeLessThan(-18);
  expect(early.noise).toBeGreaterThan(-25);
  expect(clear.music).toBeCloseTo(audioLevels(1400).music);
  expect(clear.noise).toBeLessThan(-70);
  expect(audioLevels(1400, 0.9).music).toBeCloseTo(early.music);
  expect(audioLevels(1400, 0.9).noise).toBeCloseTo(early.noise);
  expect(audioLevels(3000, 0.5).covered).toBe(false);
});

it('retains the pass envelope when audio starts after the initial update', async () => {
  const { engine, music, noise } = fixture();
  engine.update(1400, ['a'], 0);
  await engine.start();
  expect(music.volume.rampTo).toHaveBeenLastCalledWith(-22, expect.any(Number));
  expect(noise.volume.rampTo).toHaveBeenLastCalledWith(-20, expect.any(Number));
  engine.update(1400, ['a'], 0.25);
  expect(music.volume.rampTo.mock.lastCall[0]).toBeCloseTo(audioLevels(1400).music);
  engine.dispose();
  await vi.advanceTimersByTimeAsync(1000);
});


it('does not boost music beyond the distance limit at the outer reception edge', () => {
  const distance = 2249;
  expect(audioLevels(distance, 0).music).toBe(audioLevels(distance).music);
  expect(audioLevels(distance, 0.1).music).toBe(audioLevels(distance).music);
});

it('restarts with the fixed track on every rehearsal session even when music is already playing', async () => {
  const { engine, players } = fixture();
  engine.update(1000, ['a', 'b'], 0.5, 'live');
  await engine.start();
  await vi.advanceTimersByTimeAsync(100);
  engine.update(1000, ['farewell'], null, 'rehearsal-1');
  await vi.advanceTimersByTimeAsync(1000);
  expect(players[0].dispose).toHaveBeenCalledOnce();
  expect(players[1].dispose).toHaveBeenCalledOnce();
  expect(players[2].load).toHaveBeenCalledWith('farewell');
  expect(players[2].start).toHaveBeenCalledOnce();
  engine.update(1000, ['farewell'], null, 'rehearsal-2');
  await vi.advanceTimersByTimeAsync(1000);
  expect(players[2].dispose).toHaveBeenCalledOnce();
  expect(players[4].load).toHaveBeenCalledWith('farewell');
  expect(players[4].start).toHaveBeenCalledOnce();
  engine.dispose();
  await vi.advanceTimersByTimeAsync(1000);
});
