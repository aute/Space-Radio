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

function audioLevels(distance) {
  const covered = Number.isFinite(distance) && distance < COVERAGE_KM;
  return {
    covered,
    noise: covered ? Math.max(-200, -Math.pow((COVERAGE_KM - distance) / 60, 1.5) - 20) : -20,
    music: covered ? -(2 + (distance / COVERAGE_KM) ** 12 * 40) : -Infinity,
  };
}

module.exports = { COVERAGE_KM, validCoordinates, groundDistance, radioDistance, audioLevels };
