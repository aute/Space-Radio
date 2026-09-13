import { audioLevels } from '../../shared/radio.cjs';

const CROSSFADE = 1.6;
const EXIT_FADE = 0.6;

export class AudioController {
  constructor(adapter, random = Math.random) {
    Object.assign(this, { adapter, random, distance: null, playlist: [], started: false,
      disposed: false, starting: null, current: null, queued: null, retry: null });
    this.played = new Set();
    this.failedUntil = new Map();
    this.retired = new Set();
  }

  start() {
    if (this.started || this.disposed) return Promise.resolve();
    if (this.starting) return this.starting;
    // Unlock in the click handler; coalesce double clicks before allocating nodes.
    this.starting = (async () => {
      await this.adapter.unlock();
      if (this.disposed) return;
      try {
        this.music = this.adapter.createMusicBus();
        this.noise = this.adapter.createNoise();
        this.noise.start();
        this.started = true;
        this.update(this.distance, this.playlist, this.passProgress, this.playbackSession);
      } catch (error) {
        this.noise?.dispose();
        this.music?.dispose();
        this.noise = this.music = null;
        this.started = false;
        throw error;
      }
    })().finally(() => { this.starting = null; });
    return this.starting;
  }

  update(distance, playlist, passProgress, playbackSession) {
    const newSession = this.playbackSession !== playbackSession;
    this.playbackSession = playbackSession;
    this.passProgress = passProgress;
    this.distance = distance;
    this.playlist = [...new Set(playlist)];
    if (!this.started || this.disposed) return;
    // A rehearsal restart must replace an already playing song, not only its queue.
    if (newSession) this.stopMusic();
    const levels = audioLevels(distance, passProgress);
    this.noise.volume.rampTo(levels.noise, 0.8);
    // A common bus keeps distance changes independent of each source's envelope.
    this.music.volume.rampTo(levels.covered ? levels.music : -200, EXIT_FADE);
    if (!levels.covered) {
      this.stopMusic();
    } else {
      if (this.queued && !this.playlist.includes(this.queued.url)) this.release(this.queued);
      this.pump();
    }
  }

  pump() {
    if (this.disposed || !this.started || !audioLevels(this.distance).covered ||
        this.queued || this.retired.size || this.retry || !this.playlist.length) return;
    const available = this.playlist.filter(url => (this.failedUntil.get(url) || 0) <= this.adapter.now());
    if (!available.length) {
      this.retry = this.adapter.schedule(() => { this.retry = null; this.pump(); }, 5);
      return;
    }
    let candidates = available.filter(url => !this.played.has(url));
    if (!candidates.length) {
      this.played.clear();
      candidates = available;
    }
    // Exclude the last selection at the boundary between shuffle cycles.
    if (candidates.length > 1) candidates = candidates.filter(url => url !== this.lastUrl);
    const url = candidates[Math.floor(this.random() * candidates.length)];
    const entry = { url, released: false, timer: null };
    this.queued = entry;
    void this.load(entry);
  }

  async load(entry) {
    try {
      entry.player = this.adapter.createPlayer(() => {
        // Tone invokes onstop before finishing its source bookkeeping.
        queueMicrotask(() => { this.release(entry); this.pump(); });
      }, this.music);
      await entry.player.load(entry.url);
      if (entry.released || this.disposed) return;
      const duration = entry.player.buffer.duration;
      if (!(duration > 0)) throw new Error('Empty audio buffer');
      const fade = Math.min(CROSSFADE, duration / 2);
      entry.player.fadeIn = fade;
      entry.player.fadeOut = fade;
      const now = this.adapter.now();
      entry.startAt = this.current ? Math.max(now, this.current.endAt - Math.min(this.current.fade, fade)) : now;
      entry.endAt = entry.startAt + duration;
      entry.fade = fade;
      entry.player.start(entry.startAt);
      if (entry.startAt <= now) this.promote(entry);
      else entry.timer = this.adapter.schedule(() => this.promote(entry), entry.startAt - now);
    } catch {
      if (entry.released || this.disposed) return;
      this.failedUntil.set(entry.url, this.adapter.now() + 10);
      this.release(entry);
      this.pump();
    }
  }

  promote(entry) {
    if (entry.released || this.disposed) return;
    entry.timer = null;
    if (this.current) this.retired.add(this.current);
    this.current = entry;
    this.queued = null;
    this.played.add(entry.url);
    this.lastUrl = entry.url;
    // Wait until the outgoing source is released before decoding another file.
    this.pump();
  }

  release(entry) {
    if (!entry || entry.released) return;
    entry.released = true;
    if (entry.timer !== null) this.adapter.cancel(entry.timer);
    // Stop future scheduled sources as well as disconnecting their output.
    entry.player?.stop(this.adapter.now());
    entry.player?.dispose();
    if (this.queued === entry) this.queued = null;
    if (this.current === entry) this.current = null;
    this.retired.delete(entry);
  }

  stopMusic() {
    if (this.retry !== null) this.adapter.cancel(this.retry);
    this.retry = null;
    this.release(this.queued);
    if (this.current) {
      const entry = this.current;
      this.current = null;
      this.retired.add(entry);
      entry.player.fadeOut = EXIT_FADE;
      entry.player.stop(this.adapter.now());
      // Existing Tone sources retain their original fadeOut. The bus guarantees
      // the shorter exit envelope, then releases the source even if onstop is late.
      entry.timer = this.adapter.schedule(() => {
        this.release(entry);
        this.pump();
      }, EXIT_FADE + 0.05);
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stopMusic();
    // Fade the output before freeing sources; queued playback is already canceled.
    this.noise?.volume.rampTo(-200, 0.1);
    this.music?.volume.rampTo(-200, 0.1);
    if (this.started) this.adapter.schedule(() => {
      for (const entry of this.retired) this.release(entry);
      this.noise?.dispose();
      this.music?.dispose();
    }, 0.15);
  }
}
