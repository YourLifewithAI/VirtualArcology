/**
 * Procedural ambient soundtrack — like everything else here, no downloaded
 * assets: every track is generated live from oscillators, a synthesized
 * reverb impulse, and seeded randomness. Six moods, each a different scale,
 * progression, and texture. Starts only on a user gesture (toolbar click),
 * as browsers require.
 */
import { Rng } from './Rng';

interface TrackDef {
  key: string;
  label: string;
  /** semitone offsets of the scale (from root). */
  scale: number[];
  /** chord roots as scale-degree indices, cycled. */
  progression: number[];
  /** root frequency, Hz. */
  root: number;
  /** average seconds between plucks. */
  pluckEvery: number;
  /** pad brightness: lowpass cutoff, Hz. */
  cutoff: number;
  pad: OscillatorType;
  pluck: OscillatorType;
}

export const TRACKS: TrackDef[] = [
  { key: 'meadow', label: 'Meadow', scale: [0, 2, 4, 7, 9], progression: [0, 3, 4, 1], root: 220, pluckEvery: 1.6, cutoff: 1400, pad: 'triangle', pluck: 'sine' },
  { key: 'terrace', label: 'Terrace Tide', scale: [0, 2, 3, 5, 7, 10], progression: [0, 2, 5, 3], root: 196, pluckEvery: 2.2, cutoff: 1100, pad: 'sine', pluck: 'triangle' },
  { key: 'fabhum', label: 'Fab Hum', scale: [0, 3, 5, 7, 10], progression: [0, 0, 3, 2], root: 110, pluckEvery: 3.4, cutoff: 700, pad: 'sawtooth', pluck: 'sine' },
  { key: 'railline', label: 'Railline', scale: [0, 2, 3, 5, 7, 9, 10], progression: [0, 5, 3, 4], root: 165, pluckEvery: 1.2, cutoff: 1600, pad: 'triangle', pluck: 'triangle' },
  { key: 'nightshift', label: 'Night Shift', scale: [0, 3, 5, 8, 10], progression: [0, 4, 1, 3], root: 147, pluckEvery: 2.8, cutoff: 800, pad: 'sine', pluck: 'sine' },
  { key: 'orchardrain', label: 'Orchard Rain', scale: [0, 2, 5, 7, 9], progression: [0, 1, 4, 2], root: 262, pluckEvery: 0.8, cutoff: 2000, pad: 'sine', pluck: 'triangle' },
];

export class AmbientMusic {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private wet: GainNode | null = null;
  private stops: (() => void)[] = [];
  private timers: number[] = [];
  private rng = new Rng(1);
  /** -1 = off, else index into TRACKS. */
  current = -1;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.14;
      this.master.connect(this.ctx.destination);
      // synthesized hall: 2.5 s of exponentially decaying noise
      const conv = this.ctx.createConvolver();
      const len = this.ctx.sampleRate * 2.5;
      const impulse = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8);
      }
      conv.buffer = impulse;
      this.wet = this.ctx.createGain();
      this.wet.gain.value = 0.5;
      this.wet.connect(conv);
      conv.connect(this.master);
    }
    return this.ctx;
  }

  /** Route a node to both the dry master and the reverb send. */
  private out(node: AudioNode): void {
    node.connect(this.master!);
    node.connect(this.wet!);
  }

  private freq(track: TrackDef, degree: number, octave = 0): number {
    const step = track.scale[((degree % track.scale.length) + track.scale.length) % track.scale.length];
    return track.root * Math.pow(2, (step + 12 * octave) / 12);
  }

  play(index: number): void {
    this.stop();
    const track = TRACKS[index];
    if (!track) return;
    this.current = index;
    const ctx = this.ensureContext();
    void ctx.resume();
    this.rng = new Rng(0xa11d10 + index);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = track.cutoff;
    this.out(filter);

    // bass drone on the root
    const drone = ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = track.root / 2;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.05;
    drone.connect(droneGain);
    droneGain.connect(filter);
    drone.start();
    this.stops.push(() => {
      drone.stop();
      drone.disconnect();
    });

    // pad: chord change every ~14 s, three slow voices per chord
    let chordIdx = 0;
    const playChord = (): void => {
      const degree = track.progression[chordIdx % track.progression.length];
      chordIdx++;
      const tones = [this.freq(track, degree, 0), this.freq(track, degree + 2, 0), this.freq(track, degree + 4, 1)];
      for (const f of tones) {
        const osc = ctx.createOscillator();
        osc.type = track.pad;
        osc.frequency.value = f * (1 + this.rng.float(-0.0015, 0.0015));
        const g = ctx.createGain();
        const t = ctx.currentTime;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.055, t + 5);
        g.gain.setValueAtTime(0.055, t + 9);
        g.gain.linearRampToValueAtTime(0, t + 15);
        osc.connect(g);
        g.connect(filter);
        osc.start(t);
        osc.stop(t + 15.5);
      }
    };
    playChord();
    this.timers.push(window.setInterval(playChord, 14000));

    // plucked melody through a feedback delay
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.44;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    delay.connect(fb);
    fb.connect(delay);
    this.out(delay);
    const pluck = (): void => {
      if (this.rng.chance(0.25)) return; // rests keep it breathable
      const degree = this.rng.int(0, track.scale.length * 2 - 1);
      const osc = ctx.createOscillator();
      osc.type = track.pluck;
      osc.frequency.value = this.freq(track, degree, 1 + (degree >= track.scale.length ? 1 : 0));
      const g = ctx.createGain();
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0.09, t);
      g.gain.exponentialRampToValueAtTime(0.0004, t + 1.4);
      osc.connect(g);
      g.connect(filter);
      g.connect(delay);
      osc.start(t);
      osc.stop(t + 1.5);
    };
    this.timers.push(window.setInterval(pluck, track.pluckEvery * 1000));
  }

  stop(): void {
    for (const t of this.timers) window.clearInterval(t);
    this.timers = [];
    for (const s of this.stops) s();
    this.stops = [];
    this.current = -1;
  }
}
