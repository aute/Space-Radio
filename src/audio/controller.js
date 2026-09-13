import { audioLevels } from '../../shared/radio.cjs';

export class AudioController {
  constructor(adapter, random = Math.random) {
    this.adapter = adapter;
    this.random = random;
    this.distance = null;
    this.playlist = [];
    this.played = new Set();
    this.started = false;
    this.disposed = false;
    this.generation = 0;
    this.player = null;
    this.loading = false;
    this.noise = null;
    this.retry = null;
  }

  async start() {
    if (this.started || this.disposed) return;
    // Call unlock directly from the user's click, before any asynchronous loading.
    await this.adapter.unlock();
    if (this.disposed || this.started) return;
    this.started = true;
    this.noise = this.adapter.createNoise();
    this.noise.start();
    this.update(this.distance, this.playlist);
  }

  update(distance, playlist) {
    this.distance = distance;
    this.playlist = [...playlist];
    if (!this.started || this.disposed) return;
    const levels = audioLevels(distance);
    this.noise.volume.value = levels.noise;
    if (!levels.covered) {
      this.stopMusic();
      return;
    }
    if (this.player) this.player.volume.value = levels.music;
    else if (!this.loading && !this.retry) void this.next();
  }

  async next() {
    if (!this.started || this.disposed || !audioLevels(this.distance).covered || !this.playlist.length) return;
    let candidates = this.playlist.filter(track => !this.played.has(track));
    if (!candidates.length) { this.played.clear(); candidates = this.playlist; }
    const track = candidates[Math.floor(this.random() * candidates.length)];
    this.played.add(track);
    const generation = ++this.generation;
    this.loading = true;
    const player = this.adapter.createPlayer(() => {
      // Let Tone finish its own end callback before disposing the source timeline.
      queueMicrotask(() => {
        if (generation !== this.generation || this.disposed) return;
        this.player = null;
        player.dispose();
        void this.next();
      });
    });
    this.player = player;
    try {
      await player.load(track);
      if (generation !== this.generation || this.disposed) return;
      player.volume.value = audioLevels(this.distance).music;
      player.start();
    } catch {
      if (generation === this.generation && !this.disposed) {
        this.player = null;
        player.dispose();
        // Retry at a bounded rate if a media file cannot be downloaded or decoded.
        this.retry = setTimeout(() => { this.retry = null; void this.next(); }, 5000);
      }
    } finally {
      if (generation === this.generation) this.loading = false;
    }
  }

  stopMusic() {
    this.generation++;
    this.loading = false;
    clearTimeout(this.retry);
    this.retry = null;
    const player = this.player;
    this.player = null;
    player?.dispose();
  }

  dispose() {
    this.disposed = true;
    this.stopMusic();
    this.noise?.dispose();
  }
}
