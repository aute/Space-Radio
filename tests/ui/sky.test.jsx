import React from 'react';
import { afterEach, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import SkyBackground from '../../src/components/SkyBackground';
import { solarElevation, skyColors, skyForTime } from '../../src/components/SkyBackground/sky';

afterEach(() => vi.useRealTimers());

it('tracks solar noon, night, longitude and polar seasons', () => {
  const noon = Date.parse('2026-03-20T12:00:00Z');
  expect(solarElevation(noon, { lat: 0, lng: 0 })).toBeGreaterThan(87);
  expect(solarElevation(noon, { lat: 0, lng: 180 })).toBeLessThan(-87);
  expect(solarElevation(Date.parse('2026-06-21T00:00:00Z'), { lat: 80, lng: 0 })).toBeGreaterThan(10);
  expect(solarElevation(Date.parse('2026-12-21T12:00:00Z'), { lat: 80, lng: 0 })).toBeLessThan(-10);
});

it('keeps night subdued and daylight lighter toward the horizon', () => {
  const night = skyColors(-30);
  const day = skyColors(60);
  expect(night.every(color => color[0] < 0.2)).toBe(true);
  expect(day[4][0]).toBeGreaterThan(day[0][0]);
  expect(day[0][2]).toBeLessThan(0); // Negative Oklab b represents a blue zenith.
});

it('has continuous colors and slopes across palette boundaries', () => {
  const epsilon = 0.0001;
  for (const altitude of [-18, -12, -6, -2, 0, 4, 12, 30, 60]) {
    const left = skyColors(altitude - epsilon);
    const middle = skyColors(altitude);
    const right = skyColors(altitude + epsilon);
    for (let stop = 0; stop < 5; stop++) for (let channel = 0; channel < 3; channel++) {
      expect(Math.abs(right[stop][channel] - left[stop][channel])).toBeLessThan(0.0001);
      const slopeBefore = (middle[stop][channel] - left[stop][channel]) / epsilon;
      const slopeAfter = (right[stop][channel] - middle[stop][channel]) / epsilon;
      expect(Math.abs(slopeAfter - slopeBefore)).toBeLessThan(0.0001);
    }
  }
});

it('does not jump at midnight or depend on hourly time buckets', () => {
  const midnight = Date.parse('2026-09-14T16:00:00Z');
  const location = { lat: 31.17, lng: 121.45 };
  const before = skyForTime(midnight - 1000, location).colors;
  const after = skyForTime(midnight + 1000, location).colors;
  expect(Math.max(...before.flatMap((color, i) => color.map((value, j) => Math.abs(value - after[i][j]))))).toBeLessThan(0.001);
  const dawn = Date.parse('2026-09-14T21:40:00Z');
  expect(skyForTime(dawn, location).colors).not.toEqual(skyForTime(dawn + 1000, location).colors);
});

it('updates its live sky within a second and releases its timer', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-14T21:40:00Z'));
  const view = render(<SkyBackground location={{ lat: 31.17, lng: 121.45 }} />);
  const initial = view.container.firstChild.getAttribute('style');
  act(() => vi.advanceTimersByTime(1000));
  expect(view.container.firstChild.getAttribute('style')).not.toBe(initial);
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
