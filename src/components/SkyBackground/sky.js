import { validCoordinates } from '../../../shared/radio.cjs';

const RAD = Math.PI / 180;
const DAY = 86400000;

// NOAA's solar-coordinate equations, expressed in Julian centuries to avoid
// calendar/year boundaries. Geometric elevation is sufficient for sky color.
// https://gml.noaa.gov/grad/solcalc/calcdetails.html
export function solarElevation(timestamp, { lat, lng }) {
  const centuries = (timestamp / DAY + 2440587.5 - 2451545) / 36525;
  const meanLongitude = (280.46646 + centuries * (36000.76983 + centuries * 0.0003032)) * RAD;
  const anomaly = (357.52911 + centuries * (35999.05029 - 0.0001537 * centuries)) * RAD;
  const center = Math.sin(anomaly) * (1.914602 - centuries * (0.004817 + 0.000014 * centuries)) +
    Math.sin(2 * anomaly) * (0.019993 - 0.000101 * centuries) + Math.sin(3 * anomaly) * 0.000289;
  const omega = (125.04 - 1934.136 * centuries) * RAD;
  const longitude = meanLongitude + (center - 0.00569 - 0.00478 * Math.sin(omega)) * RAD;
  const obliquity = (23 + (26 + (21.448 - centuries * (46.815 + centuries * (0.00059 - centuries * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(omega)) * RAD;
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(longitude));
  const eccentricity = 0.016708634 - centuries * (0.000042037 + 0.0000001267 * centuries);
  const y = Math.tan(obliquity / 2) ** 2;
  const equationOfTime = 4 / RAD * (y * Math.sin(2 * meanLongitude) - 2 * eccentricity * Math.sin(anomaly) +
    4 * eccentricity * y * Math.sin(anomaly) * Math.cos(2 * meanLongitude) -
    0.5 * y * y * Math.sin(4 * meanLongitude) - 1.25 * eccentricity ** 2 * Math.sin(2 * anomaly));
  const utcMinutes = ((timestamp % DAY) + DAY) % DAY / 60000;
  const hourAngle = (utcMinutes / 4 + equationOfTime / 4 + lng - 180) * RAD;
  const sine = Math.sin(lat * RAD) * Math.sin(declination) + Math.cos(lat * RAD) * Math.cos(declination) * Math.cos(hourAngle);
  return Math.asin(Math.max(-1, Math.min(1, sine))) / RAD;
}

function toOklab(hex) {
  const [r, g, b] = hex.match(/[0-9a-f]{2}/gi).map(value => {
    const channel = parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

// Five elevations of the view: zenith, upper sky, middle, lower sky, horizon.
// The short warm band around sunrise/set avoids a full-screen magenta wash.
const night = ['#02040b', '#030611', '#040914', '#070e1b', '#0a1120'];
const palette = [
  [-90, night],
  [-18, night],
  [-12, ['#071126', '#0b1b37', '#112943', '#1b374f', '#304757']],
  [-6, ['#102748', '#1c3f63', '#365d7c', '#747d89', '#bfaaa0']],
  [-2, ['#1b3c63', '#305e83', '#6a8da4', '#c2b7ad', '#f2c49f']],
  [0, ['#214b76', '#3c759e', '#86afc5', '#d9d5c5', '#f4cfaa']],
  [4, ['#286699', '#4a90b9', '#95bfd5', '#c9dce2', '#e8e4d6']],
  [12, ['#2479b5', '#4d9bcb', '#87b9da', '#b4d2e4', '#d2e3eb']],
  [30, ['#2079ba', '#4394ca', '#75b2d9', '#a5cce5', '#c6dfed']],
  [60, ['#1c71b2', '#3e8fc6', '#72aed5', '#a7cde4', '#cfe3ed']],
  [90, ['#1b6eae', '#3c8bc2', '#72acd3', '#a8cce1', '#cfe2eb']],
].map(([elevation, colors]) => ({ elevation, colors: colors.map(toOklab) }));

// Monotone cubic Hermite slopes keep both color and velocity continuous at keys,
// without the overshoot or repeated easing-to-a-stop of separate hourly tweens.
function slope(index, stop, channel) {
  if (index === 0 || index === palette.length - 1) return 0;
  const before = palette[index - 1];
  const current = palette[index];
  const after = palette[index + 1];
  const h0 = current.elevation - before.elevation;
  const h1 = after.elevation - current.elevation;
  const d0 = (current.colors[stop][channel] - before.colors[stop][channel]) / h0;
  const d1 = (after.colors[stop][channel] - current.colors[stop][channel]) / h1;
  if (d0 * d1 <= 0) return 0;
  return (3 * (h0 + h1)) / ((2 * h1 + h0) / d0 + (h1 + 2 * h0) / d1);
}

export function skyColors(elevation) {
  const value = Math.max(-90, Math.min(90, elevation));
  const index = Math.max(0, palette.findIndex((key, i) => i < palette.length - 1 && value <= palette[i + 1].elevation));
  const from = palette[index];
  const to = palette[index + 1];
  const width = to.elevation - from.elevation;
  const t = (value - from.elevation) / width;
  return from.colors.map((color, stop) => color.map((start, channel) =>
    (2 * t ** 3 - 3 * t ** 2 + 1) * start + (t ** 3 - 2 * t ** 2 + t) * width * slope(index, stop, channel) +
    (-2 * t ** 3 + 3 * t ** 2) * to.colors[stop][channel] + (t ** 3 - t ** 2) * width * slope(index + 1, stop, channel),
  ));
}

export function skyForTime(timestamp, location) {
  const date = new Date(timestamp);
  const hours = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600 + date.getMilliseconds() / 3600000;
  const elevation = location && validCoordinates(location.lat, location.lng)
    ? solarElevation(Number(date), location)
    : -60 * Math.cos(hours * Math.PI / 12);
  return { elevation, colors: skyColors(elevation) };
}

export function skyStyle(timestamp, location) {
  const names = ['top', 'upper', 'middle', 'lower', 'horizon'];
  return Object.fromEntries(skyForTime(timestamp, location).colors.map((color, index) =>
    [`--sky-${names[index]}`, `oklab(${color.map(value => value.toFixed(6)).join(' ')})`],
  ));
}
