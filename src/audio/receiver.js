import { Filter, Gain, LFO, Noise, Oscillator, Volume, getContext, now } from 'tone';

// A quiet receiver bed with moving bandwidth and occasional soft tuning detail.
// All layers share the original distance-controlled output level.
export class ReceiverNoise {
  constructor(random = Math.random) {
    this.random = random;
    this.nodes = [];
    const own = node => { this.nodes.push(node); return node; };
    this.output = own(new Volume(-200).toDestination());
    this.volume = this.output.volume;
    const highpass = own(new Filter(90, 'highpass'));
    const lowpass = own(new Filter(4600, 'lowpass'));
    const bedGain = own(new Gain(0.55));
    this.bed = own(new Noise('pink'));
    this.bed.chain(highpass, lowpass, bedGain, this.output);
    this.breath = own(new LFO({ frequency: 0.073, min: 0.4, max: 0.65 }));
    this.breath.connect(bedGain.gain);

    const band = own(new Filter({ frequency: 800, type: 'bandpass', Q: 2.5 }));
    const bandGain = own(new Gain(0.22));
    this.static = own(new Noise('white'));
    this.static.chain(band, bandGain, this.output);
    this.drift = own(new LFO({ frequency: 0.047, min: 280, max: 2200 }));
    this.drift.connect(band.frequency);

    this.tuningBand = own(new Filter({ frequency: 600, type: 'bandpass', Q: 4 }));
    this.tuningGain = own(new Gain(0));
    this.static.chain(this.tuningBand, this.tuningGain, this.output);
    this.tone = own(new Oscillator({ frequency: 340, type: 'sine' }));
    this.toneGain = own(new Gain(0));
    this.tone.chain(this.toneGain, this.output);
  }

  start() {
    this.bed.start();
    this.static.start();
    this.tone.start();
    this.breath.start();
    this.drift.start();
    this.scheduleDetail();
  }

  scheduleDetail() {
    this.timer = getContext().setTimeout(() => {
      if (this.disposed) return;
      const time = now();
      const length = 0.5 + this.random() * 1.3;
      const frequency = 240 + this.random() * 1200;
      this.tuningBand.frequency.setValueAtTime(frequency, time);
      this.tuningBand.frequency.exponentialRampToValueAtTime(300 + this.random() * 1700, time + length);
      // Smooth attack/release prevents transient clicks and keeps interference gentle.
      this.tuningGain.gain.setValueAtTime(0, time);
      this.tuningGain.gain.linearRampToValueAtTime(0.12 + this.random() * 0.2, time + 0.09);
      this.tuningGain.gain.linearRampToValueAtTime(0, time + length);
      this.tone.frequency.setValueAtTime(frequency, time);
      this.tone.frequency.exponentialRampToValueAtTime(frequency * 0.6, time + length);
      this.toneGain.gain.setValueAtTime(0, time);
      this.toneGain.gain.linearRampToValueAtTime(0.003 + this.random() * 0.005, time + 0.15);
      this.toneGain.gain.linearRampToValueAtTime(0, time + length);
      this.scheduleDetail();
    }, 4 + this.random() * 8);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    getContext().clearTimeout(this.timer);
    // Noise.dispose only disconnects its looping source in Tone 15. Stop it
    // explicitly so repeated starts do not accumulate inaudible native sources.
    this.bed.stop();
    this.static.stop();
    this.tone.stop();
    this.breath.stop();
    this.drift.stop();
    // Dispose sources first, then their filters and output bus.
    for (const node of [...this.nodes].reverse()) node.dispose();
  }
}
