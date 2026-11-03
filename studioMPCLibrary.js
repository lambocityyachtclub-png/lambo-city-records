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
  "BOOM BAP", "WEST COAST FUNK POCKET", "SOUL CHOP SWING", "JAZZ ROOM", "HARD 808 LOW END",
  "MINIMAL MELODIC BOUNCE", "SYNCOPATED PERCUSSION", "CINEMATIC SOUL DRUMS", "LIVE-BAND HIP-HOP", "POLYRHYTHMIC TEXTURES"
];
const PRODUCER_APPROACHES = [
  "Dr. Dre — controlled low end and West Coast funk",
  "Pharrell Williams — minimal bounce and negative space",
  "Timbaland — syncopated percussion and rhythmic texture",
  "J Dilla — swung sample-chop feel",
  "Just Blaze — cinematic soul and hard drums",
  "1500 or Nothin — live-band musicality"
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
    influence: PRODUCER_APPROACHES[index % PRODUCER_APPROACHES.length],
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

function playSound(audio, sound, time, bus, velocity = 1) {
  if (!audio || audio.state !== "running" || !sound) return false;
  const family = sound.family;
  const duration = clamp(sound.decay, 0.06, 1.2);
  const pitch = clamp(sound.frequency, 28, 900);
  const brightness = clamp(sound.brightness, 0.1, 1);
  const out = bus.input;
  const velocityScale = clamp(Number(velocity) || 1, 0, 1.5);
  const amp = (length = duration, peak = 0.6, attack = 0.004) => {
    const node = audio.createGain();
    node.gain.setValueAtTime(0.0001, time);
    node.gain.exponentialRampToValueAtTime(Math.max(0.001, peak * velocityScale), time + attack);
    node.gain.exponentialRampToValueAtTime(0.0001, time + length);
    node.connect(out);
    return node;
  };
  const tone = (frequency, type, destination, length = duration, endFrequency = frequency, detune = 0) => {
    const osc = audio.createOscillator();
    osc.type = type;
    osc.detune.value = detune;
    osc.frequency.setValueAtTime(Math.max(20, frequency), time);
    if (endFrequency !== frequency) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), time + Math.min(length, 0.24));
    }
    osc.connect(destination);
    osc.start(time);
    osc.stop(time + length + 0.025);
    return osc;
  };
  const noise = (destination, length, filterType, cutoff, peak = 0.4, attack = 0.002) => {
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    source.buffer = noiseBuffer(audio, Math.min(0.8, length + 0.04));
    filter.type = filterType;
    filter.frequency.setValueAtTime(cutoff, time);
    filter.Q.value = filterType === "bandpass" ? 0.9 : 0.7;
    const gain = amp(length, peak, attack);
    source.connect(filter);
    filter.connect(gain);
    source.start(time);
    source.stop(time + length + 0.02);
  };

  if (family === "kick") {
    const body = amp(duration, 0.92, 0.002);
    tone(pitch * 3.2, "sine", body, duration, pitch * 0.42);
    noise(amp(0.028, 0.18, 0.001), 0.026, "highpass", 4200 + brightness * 2600, 0.18, 0.001);
    return true;
  }

  if (family === "bass") {
    const sub = amp(duration, 0.62, 0.006);
    tone(pitch, "sine", sub, duration, pitch * (sound.seed % 3 === 0 ? 0.98 : 1));
    const harmonic = amp(Math.min(duration, 0.8), 0.22, 0.004);
    const filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(180 + brightness * 950, time);
    filter.Q.value = 0.8;
    tone(pitch, "sawtooth", filter, Math.min(duration, 0.8), pitch * 0.995);
    filter.connect(harmonic);
    return true;
  }

  if (family === "snare" || family === "clap" || family === "hat" || family === "perc") {
    const isHat = family === "hat";
    const isClap = family === "clap";
    const noiseLength = isHat ? Math.min(duration, 0.22) : Math.min(duration, 0.42);
    noise(out, noiseLength, isHat ? "highpass" : "bandpass",
      isHat ? 6200 + brightness * 5600 : 850 + brightness * 4200,
      isHat ? 0.25 : (isClap ? 0.42 : 0.52), 0.001);
    if (isClap) {
      for (const offset of [0.018, 0.041, 0.067]) {
        const source = audio.createBufferSource();
        const filter = audio.createBiquadFilter();
        const gain = audio.createGain();
        source.buffer = noiseBuffer(audio, 0.055);
        filter.type = "bandpass";
        filter.frequency.value = 1500 + brightness * 1800;
        gain.gain.setValueAtTime(0.0001, time + offset);
        gain.gain.exponentialRampToValueAtTime(0.2, time + offset + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + offset + 0.052);
        source.connect(filter); filter.connect(gain); gain.connect(out);
        source.start(time + offset); source.stop(time + offset + 0.06);
      }
    } else if (!isHat) {
      const body = amp(Math.min(0.19, duration), 0.3, 0.002);
      tone(pitch, "triangle", body, Math.min(0.19, duration), pitch * 0.82);
    }
    return true;
  }

  if (family === "chop" || family === "stab") {
    const filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(500 + brightness * 5200, time);
    filter.Q.value = family === "stab" ? 1.1 : 0.55;
    filter.connect(out);
    const chord = family === "stab" ? [1, 1.25, 1.498] : [1, 1.5, 2];
    chord.forEach((ratio, index) => {
      const gain = amp(duration, family === "stab" ? 0.24 : 0.2, 0.008);
      const osc = audio.createOscillator();
      osc.type = index === 1 ? "triangle" : "sawtooth";
      osc.frequency.setValueAtTime(pitch * ratio, time);
      osc.detune.value = index === 2 ? 5 : -3;
      osc.connect(gain); gain.connect(filter);
      osc.start(time); osc.stop(time + duration + 0.025);
    });
    return true;
  }

  // FX: a filtered noise sweep layered with a rising/falling tone.
  const sweepLength = Math.max(0.16, duration);
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(260, time);
  filter.frequency.exponentialRampToValueAtTime(2400 + brightness * 5200, time + Math.min(0.5, sweepLength));
  filter.Q.value = 0.65;
  noise(out, sweepLength, "bandpass", 1400 + brightness * 3600, 0.2, 0.012);
  const fx = amp(sweepLength, 0.22, 0.015);
  tone(pitch * 0.7, "sine", fx, sweepLength, pitch * (sound.seed % 2 ? 2.2 : 0.55));
  return true;
}

const StudioMPCLibrary = {
  state: null,
  bus: null,
  audio: null,

  open() {
    const state = readState();
    const priorGrowth = Math.max(0, Number(state.growthCount) || 0);
    const expectedPrior = 100 + priorGrowth * 20;
    if (!Array.isArray(state.sounds)) state.sounds = [];
    // Migrate earlier browser saves while preserving every existing ID.
    for (let index = state.sounds.length; index < expectedPrior; index++) {
      state.sounds.push(makeSound(index));
    }
    const existingIds = new Set(state.sounds.map(sound => sound.id));
    let added = 0;
    for (let index = state.sounds.length; added < 20; index++) {
      const sound = makeSound(index);
      if (existingIds.has(sound.id)) continue;
      state.sounds.push(sound);
      existingIds.add(sound.id);
      added++;
    }
    state.growthCount = priorGrowth + 1;
    this.state = state;
    writeState(state);
    return {
      sounds: this.getSounds(),
      added,
      unlocked: Boolean(state.unlocked),
      total: state.sounds.length + (state.unlocked ? 200 : 0)
    };
  },

  getSounds() {
    if (!this.state) this.state = readState();
    if (!Array.isArray(this.state.sounds)) this.state.sounds = [];
    return this.state.unlocked
      ? [...this.state.sounds, ...Array.from({ length: 200 }, (_, index) => makeSound(index, true))]
      : this.state.sounds.slice();
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

  play(audio, sound, time = audio?.currentTime, velocity = 1) {
    if (!audio || !sound) return false;
    if (this.audio !== audio || !this.bus) {
      this.audio = audio;
      this.bus = createBus(audio);
    }
    return playSound(audio, sound, time, this.bus, velocity);
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
