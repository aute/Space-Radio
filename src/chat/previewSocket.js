// Reuse the real message UI without broadcasting rehearsal text to live listeners.
export function createPreviewSocket(canSend, getLocation) {
  const listeners = new Set();
  return {
    on(event, listener) { if (event === 'hello') listeners.add(listener); },
    off(event, listener) { if (event === 'hello') listeners.delete(listener); },
    emit(event, text) {
      if (event !== 'helloWorld' || !canSend() || typeof text !== 'string' || !text.trim() || text.length > 2000) return;
      const location = getLocation();
      if (!location) return;
      const message = { lat: location.lat, lng: location.lng, text, message_key: crypto.randomUUID() };
      for (const listener of listeners) listener(message);
    },
  };
}
