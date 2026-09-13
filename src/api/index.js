export function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Location is not supported by this browser.'));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      () => reject(new Error('Please allow location access, then retry.')),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
  });
}

export async function getPasses({ lat, lng }, signal) {
  const query = new URLSearchParams({ lat, lon: lng });
  const timeout = AbortSignal.timeout(20000);
  const response = await fetch(`/api/iss/passes?${query}`, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  if (!response.ok) throw new Error('ISS predictions are temporarily unavailable. Please retry.');
  const data = await response.json();
  if (!Array.isArray(data.response)) throw new Error('Invalid ISS forecast response.');
  return data.response;
}

export async function getPositionAt(time, signal) {
  const response = await fetch(`/api/iss/position?time=${Math.round(time)}`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
  });
  if (!response.ok) throw new Error('无法获取测试时刻的 ISS 位置，请稍后重试或恢复实时。');
  return response.json();
}
