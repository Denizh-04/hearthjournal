import { useSyncExternalStore } from "react";
import type { Instrument, Mood } from "./moods";

/** Procedural Web Audio music engine. Mood shapes tempo/scale/chords; instruments toggle layers. */
interface MoodSpec { bpm: number; root: number; chords: number[][]; bright: number }
const MOOD_SPECS: Record<Mood, MoodSpec> = {
  // chords as semitone offsets from root
  calm: { bpm: 68, root: 57, chords: [[0, 4, 7, 11], [5, 9, 12, 16], [-3, 0, 4, 7], [2, 5, 9, 12]], bright: 900 },
  uplifting: { bpm: 104, root: 60, chords: [[0, 4, 7, 12], [7, 11, 14, 19], [9, 12, 16, 21], [5, 9, 12, 17]], bright: 2400 },
  comforting: { bpm: 60, root: 55, chords: [[0, 4, 7, 14], [-3, 0, 4, 9], [5, 9, 12, 16], [7, 11, 14, 17]], bright: 700 },
  energetic: { bpm: 122, root: 52, chords: [[0, 7, 12, 15], [-4, 3, 8, 12], [-2, 5, 10, 14], [3, 7, 10, 15]], bright: 3200 },
};

export interface MusicState { playing: boolean; mood: Mood; instruments: Instrument[]; volume: number }
let state: MusicState = { playing: false, mood: "calm", instruments: ["piano", "bass"], volume: 0.6 };
const listeners = new Set<() => void>();
const set = (p: Partial<MusicState>) => { state = { ...state, ...p }; listeners.forEach((l) => l()); };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let filter: BiquadFilterNode | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let step = 0;
let nextTime = 0;

const freq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

function tone(t: number, f: number, dur: number, type: OscillatorType, vol: number, attack = 0.01, vibrato = false) {
  if (!ctx || !filter) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = f;
  if (vibrato) {
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.frequency.value = 5.5;
    lg.gain.value = f * 0.006;
    lfo.connect(lg).connect(o.frequency);
    lfo.start(t); lfo.stop(t + dur + 0.1);
  }
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(filter);
  o.start(t); o.stop(t + dur + 0.05);
}

function noise(t: number, dur: number, vol: number, hp: number) {
  if (!ctx || !master) return;
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource();
  s.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = "highpass"; f.frequency.value = hp;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(master);
  s.start(t);
}

function kick(t: number, vol: number) {
  if (!ctx || !master) return;
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(g).connect(master); o.start(t); o.stop(t + 0.35);
}

function schedule(t: number, s: number) {
  const spec = MOOD_SPECS[state.mood];
  const eighth = 60 / spec.bpm / 2;
  const bar = Math.floor(s / 8) % spec.chords.length;
  const chord = spec.chords[bar]!.map((n) => spec.root + n);
  const pos = s % 8;
  const has = (i: Instrument) => state.instruments.includes(i);

  if (has("piano")) {
    const arp = [0, 1, 2, 3, 2, 1, 2, 3][pos]!;
    tone(t, freq(chord[arp]! + 12), eighth * 3, "triangle", 0.12, 0.005);
    if (pos === 0) chord.forEach((n) => tone(t, freq(n), eighth * 7, "sine", 0.05, 0.02));
  }
  if (has("bass") && (pos === 0 || pos === 4 || (state.mood === "energetic" && pos % 2 === 0))) {
    tone(t, freq(chord[0]! - 12), eighth * (state.mood === "energetic" ? 1.6 : 3.5), "sine", 0.28, 0.01);
  }
  if (has("violin") && pos === 0) {
    tone(t, freq(chord[2]! + 12), eighth * 8, "sawtooth", 0.035, eighth * 2, true);
    tone(t, freq(chord[1]! + 12), eighth * 8, "sawtooth", 0.025, eighth * 2.5, true);
  }
  if (has("drums")) {
    const soft = state.mood === "calm" || state.mood === "comforting";
    if (pos === 0 || (!soft && pos === 4) || (state.mood === "energetic" && pos === 6)) kick(t, soft ? 0.35 : 0.6);
    if (pos === 4 && !soft) noise(t, 0.18, 0.18, 1500);
    if (pos % 2 === 1 || state.mood === "energetic") noise(t, 0.05, soft ? 0.04 : 0.07, 7000);
  }
}

function tick() {
  if (!ctx) return;
  const eighth = 60 / MOOD_SPECS[state.mood].bpm / 2;
  while (nextTime < ctx.currentTime + 0.15) {
    schedule(nextTime, step);
    step++;
    nextTime += eighth;
  }
}

export const music = {
  async play() {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.connect(master).connect(ctx.destination);
    }
    await ctx.resume();
    master!.gain.value = state.volume * 0.8;
    filter!.frequency.value = MOOD_SPECS[state.mood].bright;
    if (!timer) { step = 0; nextTime = ctx.currentTime + 0.05; timer = setInterval(tick, 40); }
    set({ playing: true });
  },
  stop() {
    if (timer) clearInterval(timer);
    timer = null;
    ctx?.suspend();
    set({ playing: false });
  },
  setMood(mood: Mood) {
    set({ mood });
    if (filter && ctx) filter.frequency.setTargetAtTime(MOOD_SPECS[mood].bright, ctx.currentTime, 0.5);
  },
  toggleInstrument(i: Instrument) {
    set({ instruments: state.instruments.includes(i) ? state.instruments.filter((x) => x !== i) : [...state.instruments, i] });
  },
  setVolume(volume: number) {
    set({ volume });
    if (master && ctx) master.gain.setTargetAtTime(volume * 0.8, ctx.currentTime, 0.1);
  },
};

export function useMusic(): MusicState {
  return useSyncExternalStore((cb) => (listeners.add(cb), () => listeners.delete(cb)), () => state, () => state);
}
