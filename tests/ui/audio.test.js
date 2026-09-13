import { it, expect, vi } from 'vitest';
import { AudioController } from '../../src/audio/controller';
import { audioLevels } from '../../shared/radio.cjs';

function fixture() {
  const players = [];
  const noise = { start: vi.fn(), dispose: vi.fn(), volume: { value: 0 } };
  const adapter = {
    unlock: vi.fn(async () => {}), createNoise: () => noise,
    createPlayer: onstop => {
      const player = { onstop, load: vi.fn(async () => {}), start: vi.fn(), dispose: vi.fn(), volume: { value: 0 } };
      players.push(player);
      return player;
    },
  };
  return { engine: new AudioController(adapter, () => 0), adapter, players, noise };
}

it('keeps the original distance-volume curve and silence outside coverage', () => {
  expect(audioLevels(2250)).toEqual({ covered: false, noise: -20, music: -Infinity });
  expect(audioLevels(null).covered).toBe(false);
  expect(audioLevels(2190).noise).toBe(-21);
  expect(audioLevels(1125).music).toBeCloseTo(-(2 + 40 / 4096));
});

it('unlocks on a gesture, plays each track once, and disposes audio on exit', async () => {
  const { engine, adapter, players, noise } = fixture();
  engine.update(1000, ['a', 'b']);
  expect(adapter.unlock).not.toHaveBeenCalled();
  await engine.start();
  await Promise.resolve();
  expect(players[0].load).toHaveBeenCalledWith('a');
  expect(players[0].start).toHaveBeenCalledOnce();
  players[0].onstop();
  await Promise.resolve();
  expect(players[1].load).toHaveBeenCalledWith('b');
  engine.update(3000, ['a', 'b']);
  expect(players[1].dispose).toHaveBeenCalledOnce();
  expect(noise.volume.value).toBe(-20);
  engine.dispose();
  expect(noise.dispose).toHaveBeenCalledOnce();
});

it('does not start a late audio download after leaving coverage', async () => {
  const { engine, adapter } = fixture();
  let finish;
  const player = { volume: {}, load: () => new Promise(resolve => { finish = resolve; }), start: vi.fn(), dispose: vi.fn() };
  adapter.createPlayer = () => player;
  engine.update(1000, ['a']);
  await engine.start();
  engine.update(3000, ['a']);
  finish();
  await Promise.resolve();
  expect(player.start).not.toHaveBeenCalled();
  engine.dispose();
});
