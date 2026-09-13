export { groundDistance as GetDistance, radioDistance as GetISSDistance } from '../../shared/radio.cjs';

function dms(value, width, positive, negative) {
  const seconds = Math.round(Math.abs(value) * 3600);
  const degrees = String(Math.floor(seconds / 3600)).padStart(width, '0');
  const minutes = String(Math.floor(seconds / 60) % 60).padStart(2, '0');
  return `${degrees}°${minutes}′${String(seconds % 60).padStart(2, '0')}″${value < 0 ? negative : positive}`;
}

// Preserve the original coordinates and AM/PM typography without legacy libraries.
export function formatCoordinates(lat = 0, lng = 0) {
  return `${dms(lat, 2, 'N', 'S')}, ${dms(lng, 3, 'E', 'W')}`;
}
export function formatTime(timestamp) {
  if (!Number.isFinite(timestamp)) return '--:--:--';
  const date = new Date(timestamp);
  const pad = value => String(value).padStart(2, '0');
  return `${date.getHours() < 12 ? 'AM' : 'PM'} ${pad(date.getHours() % 12 || 12)}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
