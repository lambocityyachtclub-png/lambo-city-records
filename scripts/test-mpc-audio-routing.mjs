import assert from "node:assert/strict";

const storage = new Map();
globalThis.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); }
};

class Param {
  constructor(value = 0) { this.value = value; this.values = []; }
  setValueAtTime(value) { this.value = value; this.values.push(value); }
  exponentialRampToValueAtTime(value) { this.value = value; this.values.push(value); }
  linearRampToValueAtTime(value) { this.value = value; this.values.push(value); }
  setTargetAtTime(value) { this.value = value; this.values.push(value); }
}
class Node {
  constructor(type) {
    this.type = type;
    this.connections = [];
    this.gain = new Param(1);
    this.frequency = new Param(440);
    this.detune = new Param(0);
    this.pan = new Param(0);
    this.threshold = new Param(0);
    this.knee = new Param(0);
    this.ratio = new Param(1);
    this.attack = new Param(0);
    this.release = new Param(0);
    this.Q = new Param(0);
    this.type = type;
    this.stopTimes = [];
  }
  connect(node) { this.connections.push(node); }
  start() {}
  stop(time) { this.stopTimes.push(time); }
}
class AudioMock {
  constructor() {
    this.state = "running";
    this.currentTime = 1;
    this.sampleRate = 44100;
    this.destination = new Node("destination");
    this.nodes = [];
  }
  add(type) { const node = new Node(type); this.nodes.push(node); return node; }
  createGain() { return this.add("gain"); }
  createDynamicsCompressor() { return this.add("compressor"); }
  createStereoPanner() { return this.add("panner"); }
  createOscillator() { return this.add("oscillator"); }
  createBufferSource() { return this.add("buffer-source"); }
  createBiquadFilter() { return this.add("filter"); }
  createBuffer(channels, length) {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return { getChannelData: index => data[index] };
  }
}

const { default: library } = await import("../studioMPCLibrary.js");
library.open();
const audio = new AudioMock();
const kick = library.getSounds().find(sound => sound.family === "kick");
assert.ok(kick);
assert.equal(library.play(audio, kick, audio.currentTime, 0.7, { volume: 0.5, pan: -0.4, pitch: 2, decay: 5 }), true);
const panner = audio.nodes.find(node => node.type === "panner");
assert.ok(panner, "MPC creates a stereo pan stage");
assert.equal(panner.pan.value, -0.4);
const oscillator = audio.nodes.find(node => node.type === "oscillator");
assert.ok(oscillator, "MPC creates a pitched oscillator for the kick");
assert.equal(oscillator.frequency.values[0], kick.frequency * 2 * 3.2, "Pad pitch changes preset tuning");
assert.ok(Math.abs(oscillator.stopTimes[0] - (audio.currentTime + kick.decay * 0.5 + 0.025)) < 0.000001, "Pad decay changes preset length");
const output = audio.nodes.find(node => node.type === "gain" && node.connections.some(node => node.type === "compressor"));
assert.ok(output, "MPC preset output feeds its dynamics chain");

library.setMasterVolume(0.42);
assert.equal(library.bus.input.gain.value, 0.42);
assert.equal(storage.get("lambocity-mpc-master-level-v1"), "0.42");
console.log("MPC audio routing and per-pad mix tests passed.");
