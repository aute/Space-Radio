import { createRoot } from 'react-dom/client';
import App from '../../src/App';
import { RadioStore } from '../../src/mobx/store';
import '../../src/index.css';

// Controlled browser regression fixture only. This entry is never built by npm run build.
const handlers = new Map();
const fire = (name, data) => handlers.get(name)?.(data);
const socket = {
  on(name, fn) { handlers.set(name, fn); },
  off(name) { handlers.delete(name); },
  connect() {
    queueMicrotask(() => {
      fire('connect');
      fire('issPositionChange', { latitude: 31.17, longitude: 121.45 });
      fire('playList', ['./musicList/1.mp3', './musicList/2.mp3']);
    });
  },
  disconnect() {},
  emit(name, text) {
    if (name === 'helloWorld') fire('hello', { text, lat: 31.17, lng: 121.45, message_key: crypto.randomUUID() });
  },
};
const now = Date.now();
const store = new RadioStore({
  socket,
  locate: async () => ({ lat: 31.17, lng: 121.45 }),
  forecast: async () => [{ risetime: Math.floor(now / 1000) - 120, duration: 1200 }, { risetime: Math.floor(now / 1000) + 3600, duration: 500 }],
});
window.radioFixture = {
  leaveCoverage() { fire('issPositionChange', { latitude: -31.17, longitude: -58.55 }); fire('disconnect'); },
  reenterCoverage() { fire('issPositionChange', { latitude: 31.17, longitude: 121.45 }); fire('connect'); },
};
createRoot(document.getElementById('root')).render(<App store={store} />);
