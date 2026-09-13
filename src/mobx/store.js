import { makeAutoObservable, runInAction } from 'mobx';
import { io } from 'socket.io-client';
import { getLocation, getPasses } from '../api';
import { radioDistance, validCoordinates } from '../../shared/radio.cjs';

export class RadioStore {
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

  constructor({ socket = io({ autoConnect: false }), locate = getLocation, forecast = getPasses, now = Date.now } = {}) {
    this.socket = socket;
    this.locate = locate;
    this.forecast = forecast;
    this.now = now;
    makeAutoObservable(this, {
      socket: false, locate: false, forecast: false, now: false,
      timer: false, request: false, generation: false, active: false, nextForecast: false,
    }, { autoBind: true });
  }

  get ready() { return this.location !== null && this.position !== null; }
  get distance() {
    return this.ready ? radioDistance(this.location.lat, this.location.lng, this.position.latitude, this.position.longitude) : null;
  }
  get activePass() { return this.passes.find(pass => pass.risetime * 1000 <= this.time && (pass.risetime + pass.duration) * 1000 > this.time); }
  get passing() { return this.connected && Boolean(this.activePass); }
  get nextPass() { return this.passes.find(pass => pass.risetime * 1000 > this.time); }

  onConnect() {
    this.connected = true;
    if (this.location) this.socket.emit('join', { ...this.location });
  }
  onDisconnect() { this.connected = false; }
  onPosition(data) {
    const latitude = Number(data?.latitude);
    const longitude = Number(data?.longitude);
    if (validCoordinates(latitude, longitude)) this.position = { latitude, longitude };
    this.tick();
  }
  onPlaylist(list) {
    if (Array.isArray(list)) this.playlist = list.filter(item => typeof item === 'string' && /^\.\/musicList\/[^?#]+\.mp3$/i.test(item));
  }
  tick() {
    this.time = this.now();
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

  retry() { this.stop(); return this.start(); }
  stop() {
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
