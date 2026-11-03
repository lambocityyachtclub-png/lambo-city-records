/*
 * LAMBO CITY RECORDS — MPC SOUND LIBRARY V1
 * Procedural original sounds; no third-party samples or external audio.
 * The library and pad performances persist in this browser.
 */

import StudioAudioExport from "./studioAudioExport.js";

const STORAGE_KEY = "lambocity-mpc-library-v1";
const TAKE_KEY = "lambocity-mpc-performance-v1:";
const FAMILIES = [
  ["KICK", "kick"], ["808", "bass"], ["SNARE", "snare"], ["CLAP", "clap"],
  ["HAT", "hat"], ["PERC", "perc"], ["BASS", "bass"], ["CHOP", "chop"],
  ["STAB", "stab"], ["FX", "fx"]
];
const TONES = ["DUST", "ROUND", "HARD", "DEEP", "TIGHT", "WARM", "DARK", "BRIGHT", "DIRTY", "CLEAN"];
const STYLE_TAGS = [
  "BOOM BAP", "WEST COAST", "SOUL CHOP", "JAZZ ROOM", "808 LOW END",
  "MINIMAL BOUNCE", "DUSTY DRUMS", "CINEMATIC", "FUNK POCKET", "MODERN HIP-HOP"
];
const BANKS = ["A", "B", "C", "D"];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function hash(value) {
  let result = 2166136261;
  for (let i = 0; i < value.length; i++) {
    result ^= value.charCodeAt(i);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(16);
}

function makeSound(index, locked = false) {
  const family = FAMILIES[index % FAMILIES.length];
  const tone = TONES[Math.floor(index / FAMILIES.length) % TONES.length];
  const style = STYLE_TAGS[Math.floor(index / 3) % STYLE_TAGS.length];
  const serial = String(index + 1).padStart(3, "0");
  return {
    id: (locked ? "UNLOCK-" : "DEMO-") + serial,
    name: `${tone} ${family[0]} ${serial}`,
    family: family[1],
    style,
    tone,
    seed: index + (locked ? 1000 : 0),
    frequency: 38 + ((index * 17) % 420),
    decay: 0.07 + ((index * 13) % 38) / 100,
    brightness: 0.25 + ((index * 7) % 70) / 100,
    locked
  };
}

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        version: 1,
        sounds: Array.from({ length: 100 }, (_, index) => makeSound(index)),
        growthCount: 0,
        unlocked: false,
        unlockHash: null
      };
    }
    const state = JSON.parse(raw);
    if (!state || state.version !== 1 || !Array.isArray(state.sounds)) {
      throw new Error("Invalid MPC library data.");
    }
    return state;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("The saved MPC sound library could not be read.");
    }
    throw error;
  }
}

function writeState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    throw new Error("The MPC library could not be saved. Browser storage may be full.");
  }
}

function createBus(audio) {
  const output = StudioAudioExport.getOutput(audio);
  const compressor = audio.createDynamicsCompressor();
  compressor.threshold.value = -10;
  compressor.knee.value = 10;
  compressor.ratio.value = 3.5;
  compressor.attack.value = 0.004;
  compressor.release.value = 0.16;
  const limiter = audio.createDynamicsCompressor();
  limiter.threshold.value = -2;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.08;
  const gain = audio.createGain();
  gain.gain.value = 0.76;
  gain.connect(compressor);
  compressor.connect(limiter);
  limiter.connect(output);
  return { input: gain, compressor, limiter, output };
}

function noiseBuffer(audio, duration = 0.22) {
  const length = Math.max(1, Math.floor(audio.sampleRate * duration));
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function envelope(audio, destination, time, duration, peak = 0.65) {
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), time + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  gain.connect(destination);
  return gain;
}

function playSound(audio, sound, time, bus) {
  if (!audio || audio.state !== "running" || !sound) return false;
  const family = sound.family;
  const duration = clamp(sound.decay, 0.06, 1.2);
  const pitch = clamp(sound.frequency, 28, 900);
  const brightness = clamp(sound.brightness, 0.1, 1);
  const out = bus.input;

  if (family === "kick" || family === "bass") {
    const osc = audio.createOscillator();
    const filter = audio.createBiquadFilter();
    const amp = envelope(audio, out, time, duration, family === "kick" ? 0.82 : 0.56);
    osc.type = family === "kick" ? "sine" : (sound.seed % 2 ? "sawtooth" : "square");
    osc.frequency.setValueAtTime(family === "kick" ? pitch * 2.8 : pitch, time);
    if (family === "kick") {
      osc.frequency.exponentialRampToValueAtTime(Math.max(28, pitch * 0.42), time + Math.min(0.18, duration));
    }
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(180 + brightness * 520, time);
    osc.connect(filter);
    filter.connect(amp);
    osc.start(time);
    osc.stop(time + duration + 0.025);
    return true;
  }

  if (family === "snare" || family === "clap" || family === "hat" || family === "perc") {
    const noise = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const amp = envelope(audio, out, time, duration, family === "hat" ? 0.24 : 0.48);
    noise.buffer = noiseBuffer(audio, Math.min(0.35, duration + 0.03));
    filter.type = family === "hat" ? "highpass" : "bandpass";
    filter.frequency.setValueAtTime(
      family === "hat" ? 5200 + brightness * 4200 : 700 + brightness * 3600,
      time
    );
    filter.Q.value = family === "clap" ? 0.65 : 0.9;
    noise.connect(filter);
    filter.connect(amp);
    noise.start(time);
    noise.stop(time + duration + 0.02);
    if (family === "snare" || family === "perc") {
      const tone = audio.createOscillator();
      const toneAmp = envelope(audio, out, time, Math.min(0.16, duration), 0.22);
      tone.type = "triangle";
      tone.frequency.setValueAtTime(pitch, time);
      tone.connect(toneAmp);
      tone.start(time);
      tone.stop(time + Math.min(0.18, duration + 0.02));
    }
    return true;
  }

  const osc = audio.createOscillator();
  const second = audio.createOscillator();
  const filter = audio.createBiquadFilter();
  const amp = envelope(audio, out, time, duration, family === "fx" ? 0.28 : 0.42);
  osc.type = sound.seed % 3 === 0 ? "triangle" : "sawtooth";
  second.type = "sine";
  osc.frequency.setValueAtTime(pitch, time);
  second.frequency.setValueAtTime(pitch * (family === "chop" ? 1.5 : 2), time);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(350 + brightness * 4800, time);
  osc.connect(filter);
  second.connect(filter);
  filter.connect(amp);
  osc.start(time);
  second.start(time);
  osc.stop(time + duration + 0.025);
  second.stop(time + duration + 0.025);
  return true;
}

const StudioMPCLibrary = {
  state: null,
  bus: null,
  audio: null,

  open() {
    const state = readState();
    state.sounds = Array.from({ length: 100 }, (_, index) => makeSound(index));
    state.growthCount = Math.max(0, Number(state.growthCount) || 0) + 1;
    this.state = state;
    writeState(state);
    const total = 100 + state.growthCount * 20;
    return {
      sounds: this.getSounds(),
      added: 20,
      unlocked: Boolean(state.unlocked),
      total: total + (state.unlocked ? 200 : 0)
    };
  },

  getSounds() {
    if (!this.state) this.state = readState();
    const count = 100 + Math.max(0, Number(this.state.growthCount) || 0) * 20;
    const available = Array.from({ length: count }, (_, index) => makeSound(index));
    return this.state.unlocked
      ? [...available, ...Array.from({ length: 200 }, (_, index) => makeSound(index, true))]
      : available;
  },

  unlock(code) {
    const clean = String(code || "").trim();
    if (clean.length < 4) throw new Error("Use an unlock code with at least four characters.");
    const state = this.state || readState();
    if (!state.unlockHash) {
      state.unlockHash = hash(clean);
      state.unlocked = true;
      this.state = state;
      writeState(state);
      return true;
    }
    if (state.unlockHash !== hash(clean)) return false;
    state.unlocked = true;
    this.state = state;
    writeState(state);
    return true;
  },

  assign(bank, pad, soundId) {
    const state = this.state || readState();
    const sound = this.getSounds().find(item => item.id === soundId);
    if (!sound) throw new Error("That sound is not available in this library.");
    state.assignments = state.assignments || {};
    state.assignments[`${bank}-${pad}`] = soundId;
    this.state = state;
    writeState(state);
    return sound;
  },

  getAssignment(bank, pad) {
    const sounds = this.getSounds();
    const state = this.state || readState();
    const customId = state.assignments?.[`${bank}-${pad}`];
    if (customId) {
      const assigned = sounds.find(item => item.id === customId);
      if (assigned) return assigned;
    }
    const bankIndex = BANKS.indexOf(bank);
    const index = Math.max(0, bankIndex) * 16 + (pad - 1);
    return sounds[index % sounds.length];
  },

  play(audio, sound, time = audio?.currentTime) {
    if (!audio || !sound) return false;
    if (this.audio !== audio || !this.bus) {
      this.audio = audio;
      this.bus = createBus(audio);
    }
    return playSound(audio, sound, time, this.bus);
  },

  loadTake(projectId = "unsaved") {
    try {
      const raw = localStorage.getItem(TAKE_KEY + projectId);
      if (!raw) return { events: [], duration: 0 };
      const take = JSON.parse(raw);
      return {
        events: Array.isArray(take.events) ? take.events : [],
        duration: Math.max(0, Number(take.duration) || 0)
      };
    } catch {
      return { events: [], duration: 0 };
    }
  },

  saveTake(projectId = "unsaved", take) {
    const safeTake = {
      events: Array.isArray(take?.events) ? take.events.slice(-12000) : [],
      duration: Math.max(0, Number(take?.duration) || 0)
    };
    try {
      localStorage.setItem(TAKE_KEY + projectId, JSON.stringify(safeTake));
    } catch {
      throw new Error("The MPC performance could not be saved in this browser.");
    }
    return safeTake;
  },

  getBanks() {
    return BANKS.slice();
  }
};

export default StudioMPCLibrary;
