import { createPreviewSocket } from '../chat/previewSocket';
import { makeAutoObservable, runInAction } from 'mobx';
import { io } from 'socket.io-client';
import { getLocation, getPasses, getPositionAt } from '../api';
import { radioDistance, validCoordinates } from '../../shared/radio.cjs';

export class RadioStore {
  preview = null;
  previewPending = false;
  previewError = '';
  previewRequest = null;
  livePosition = null;
  location = null;
  position = null;
  passes = [];
  playlist = [];
  error = '';
  connected = false;
  time = 0;
  generation = 0;
  active = false;
  timer = null;
  request = null;
  nextForecast = 0;

  constructor({ socket = io({ autoConnect: false }), locate = getLocation, forecast = getPasses, predict = getPositionAt, now = Date.now, elapsedNow = () => performance.now() } = {}) {
    this.socket = socket;
    this.previewSocket = createPreviewSocket(() => Boolean(this.preview) && this.passing, () => this.location);
    this.locate = locate;
    this.forecast = forecast;
    this.now = now;
    this.elapsedNow = elapsedNow;
    this.predict = predict;
    makeAutoObservable(this, {
      socket: false, previewSocket: false, locate: false, forecast: false, now: false, predict: false, elapsedNow: false, previewRequest: false,
      timer: false, request: false, generation: false, active: false, nextForecast: false,
    }, { autoBind: true });
  }

  // Verified ID3 title: Farewell (告别), performed by Li Tai-hsiang / Tang Hsiao-shih.
  get audioPlaylist() { return this.preview ? ['./musicList/1.mp3'] : this.playlist; }
  get messageSocket() { return this.preview ? this.previewSocket : this.socket; }
  get ready() { return this.location !== null && this.position !== null; }
  get distance() {
    return this.ready ? radioDistance(this.location.lat, this.location.lng, this.position.latitude, this.position.longitude) : null;
  }
  get activePass() { return this.passes.find(pass => pass.risetime * 1000 <= this.time && (pass.risetime + pass.duration) * 1000 > this.time); }
  get visualPass() {
    if (!this.preview && !this.connected) return undefined;
    // A short visual lead-in does not advance audio reception or message eligibility.
    return this.passes.find(pass => pass.risetime * 1000 - 10000 <= this.time && (pass.risetime + pass.duration) * 1000 > this.time);
  }
  get passProgress() {
    // Undefined preserves distance-only reception while forecasts are unavailable.
    if (!this.passes.length) return undefined;
    const pass = this.activePass;
    return pass ? (this.time / 1000 - pass.risetime) / pass.duration : null;
  }
  get passing() { return (Boolean(this.preview) || this.connected) && Boolean(this.activePass); }
  get nextPass() { return this.passes.find(pass => pass.risetime * 1000 > this.time); }

  onConnect() {
    this.connected = true;
    if (this.location) this.socket.emit('join', { ...this.location });
  }
  onDisconnect() { this.connected = false; }
  onPosition(data) {
    const latitude = Number(data?.latitude);
    const longitude = Number(data?.longitude);
    if (validCoordinates(latitude, longitude)) {
      this.livePosition = { latitude, longitude };
      if (!this.preview) this.position = this.livePosition;
    }
    this.tick();
  }
  onPlaylist(list) {
    if (Array.isArray(list)) this.playlist = list.filter(item => typeof item === 'string' && /^\.\/musicList\/[^?#]+\.mp3$/i.test(item));
  }
  tick() {
    this.time = this.preview ? this.preview.time + this.elapsedNow() - this.preview.anchor : this.now();
    if (this.preview) { void this.updatePreviewPosition(); return; }
    if (this.location && !this.request && this.time >= this.nextForecast) void this.refreshForecast();
  }

  async start() {
    if (this.active) return;
    this.active = true;
    const generation = ++this.generation;
    this.time = this.now();
    this.error = '';
    // Subscribe before location/forecast requests so failures cannot block positions.
    this.socket.on('connect', this.onConnect);
    this.socket.on('disconnect', this.onDisconnect);
    this.socket.on('issPositionChange', this.onPosition);
    this.socket.on('playList', this.onPlaylist);
    this.socket.connect();
    this.timer = setInterval(this.tick, 1000);
    try {
      const location = await this.locate();
      if (!this.active || generation !== this.generation) return;
      if (!validCoordinates(location.lat, location.lng)) throw new Error('Invalid location. Please retry.');
      runInAction(() => {
        this.location = location;
        this.socket.emit('join', { ...location });
      });
      await this.refreshForecast();
    } catch (error) {
      if (this.active && generation === this.generation) runInAction(() => { this.error = error.message; });
    }
  }

  async refreshForecast() {
    if (!this.location || this.request || !this.active) return;
    const request = new AbortController();
    const generation = this.generation;
    this.request = request;
    try {
      const passes = await this.forecast(this.location, request.signal);
      if (!this.active || generation !== this.generation) return;
      runInAction(() => {
        this.passes = passes.filter(pass => Number.isFinite(pass.risetime) && Number.isFinite(pass.duration) && pass.duration > 0);
        this.error = '';
        this.nextForecast = Math.min(this.now() + 300000, ...this.passes.map(pass => (pass.risetime + pass.duration) * 1000 + 1000).filter(end => end > this.now()));
      });
    } catch (error) {
      if (this.active && generation === this.generation && !request.signal.aborted) runInAction(() => {
        this.error = error.message;
        this.nextForecast = this.now() + 30000;
      });
    } finally {
      if (this.request === request) this.request = null;
    }
  }


  async startPreview() {
    if (!this.active || this.previewPending) return;
    const pass = this.passes.find(item => item.risetime * 1000 > this.now());
    if (!pass) { this.previewError = '暂无下一次过境预测，请等待预测加载或稍后重试。'; return; }
    this.restoreLive();
    const request = new AbortController();
    this.previewRequest = request;
    this.previewPending = true;
    const time = pass.risetime * 1000 - 10000;
    try {
      const position = await this.predict(time, request.signal);
      if (this.previewRequest !== request || !this.active) return;
      if (!validCoordinates(position.latitude, position.longitude)) throw new Error('Invalid predicted position');
      runInAction(() => {
        this.preview = { time, anchor: this.elapsedNow() };
        this.time = time;
        this.position = position;
      });
    } catch (error) {
      if (this.previewRequest === request) runInAction(() => { this.previewError = error.message; });
    } finally {
      if (this.previewRequest === request) runInAction(() => { this.previewRequest = null; this.previewPending = false; });
    }
  }

  async updatePreviewPosition() {
    if (!this.preview || this.previewRequest || !this.active) return;
    const request = new AbortController();
    this.previewRequest = request;
    try {
      const position = await this.predict(this.time, request.signal);
      if (this.previewRequest !== request || !this.preview || !this.active) return;
      if (!validCoordinates(position.latitude, position.longitude)) throw new Error('Invalid predicted position');
      runInAction(() => { this.position = position; this.previewError = ''; });
    } catch (error) {
      if (this.previewRequest === request) runInAction(() => { this.previewError = error.message; this.position = null; });
    } finally {
      if (this.previewRequest === request) this.previewRequest = null;
    }
  }

  restoreLive() {
    this.previewRequest?.abort();
    this.previewRequest = null;
    this.previewPending = false;
    this.preview = null;
    this.previewError = '';
    this.time = this.now();
    this.position = this.livePosition;
  }

  retry() { this.stop(); return this.start(); }
  stop() {
    this.restoreLive();
    this.active = false;
    this.generation++;
    clearInterval(this.timer);
    this.request?.abort();
    this.request = null;
    this.socket.off('connect', this.onConnect);
    this.socket.off('disconnect', this.onDisconnect);
    this.socket.off('issPositionChange', this.onPosition);
    this.socket.off('playList', this.onPlaylist);
    this.socket.disconnect();
    this.connected = false;
  }
}
