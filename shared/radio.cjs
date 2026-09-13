const COVERAGE_KM = 2250;

function validCoordinates(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

function groundDistance(lat1, lng1, lat2, lng2) {
  const radians = value => value * Math.PI / 180;
  const a = Math.sin(radians(lat1 - lat2) / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(radians(lng1 - lng2) / 2) ** 2;
  return Math.round(2 * 6378.137 * Math.asin(Math.sqrt(Math.min(1, a))) * 10000) / 10000;
}

// Preserve the original artistic distance model, including its 350 km altitude.
function radioDistance(lat1, lng1, lat2, lng2) {
  return Math.hypot(groundDistance(lat1, lng1, lat2, lng2), 350);
}

function audioLevels(distance, passProgress) {
  const covered = Number.isFinite(distance) && distance < COVERAGE_KM;
  const levels = {
    covered,
    noise: covered ? Math.max(-200, -Math.pow((COVERAGE_KM - distance) / 60, 1.5) - 20) : -20,
    music: covered ? -(2 + (distance / COVERAGE_KM) ** 12 * 40) : -Infinity,
  };
  if (covered && passProgress !== undefined) {
    // The 10-degree visual pass starts well inside the distance-only audio radius.
    // Open reception over its first quarter; mirror the envelope on departure.
    const edge = Number.isFinite(passProgress) ? Math.min(passProgress, 1 - passProgress) : 0;
    const phase = Math.max(0, Math.min(1, edge / 0.25));
    const clarity = phase * phase * (3 - 2 * phase);
    // Keep music audible beneath the receiver bed from the start. Respect weaker
    // distance-limited signals instead of boosting them at the coverage boundary.
    const entryMusic = Math.min(-22, levels.music);
    levels.music = entryMusic + (levels.music - entryMusic) * clarity ** 3;
    levels.noise = Math.max(levels.noise, -20 - 55 * clarity ** 4);
  }
  return levels;
}

module.exports = { COVERAGE_KM, validCoordinates, groundDistance, radioDistance, audioLevels };
