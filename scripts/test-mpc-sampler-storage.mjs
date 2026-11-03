import assert from "node:assert/strict";

const local = new Map();
globalThis.localStorage = {
  getItem(key) { return local.has(key) ? local.get(key) : null; },
  setItem(key, value) { local.set(key, String(value)); },
  removeItem(key) { local.delete(key); }
};

const records = new Map();
const store = {
  put(record) { records.set(record.id, record); },
  get(id) {
    const request = {};
    queueMicrotask(() => { request.result = records.get(id); request.onsuccess?.(); });
    return request;
  },
  getAll() {
    const request = {};
    queueMicrotask(() => { request.result = [...records.values()]; request.onsuccess?.(); });
    return request;
  },
  delete(id) { records.delete(id); }
};
const db = {
  objectStoreNames: { contains: () => true },
  transaction() {
    const tx = { objectStore: () => store };
    queueMicrotask(() => tx.oncomplete?.());
    return tx;
  }
};
globalThis.indexedDB = {
  open() {
    const request = { result: db };
    queueMicrotask(() => { request.onsuccess?.(); });
    return request;
  }
};

class Param {
  constructor(value = 0) { this.value = value; }
  setValueAtTime(value) { this.value = value; }
  exponentialRampToValueAtTime(value) { this.value = value; }
  setTargetAtTime(value) { this.value = value; }
}
class AudioNode {
  constructor(kind) {
    this.kind = kind;
    this.connections = [];
    this.gain = new Param(1);
    this.playbackRate = new Param(1);
    this.pan = new Param(0);
    this.threshold = new Param(0);
    this.knee = new Param(0);
    this.ratio = new Param(1);
    this.attack = new Param(0);
    this.release = new Param(0);
  }
  connect(node) { this.connections.push(node); }
  start(...args) { this.startArgs = args; }
  stop() {}
}
class AudioMock {
  constructor() {
    this.state = "running";
    this.currentTime = 1;
    this.sampleRate = 44100;
    this.destination = new AudioNode("destination");
    this.nodes = [];
  }
  add(kind) { const node = new AudioNode(kind); this.nodes.push(node); return node; }
  createGain() { return this.add("gain"); }
  createDynamicsCompressor() { return this.add("compressor"); }
  createStereoPanner() { return this.add("panner"); }
  createBufferSource() { return this.add("buffer-source"); }
  async decodeAudioData() {
    return { duration: 2, getChannelData: () => new Float32Array(44100) };
  }
}

const { default: sampler } = await import("../studioMPCSampler.js");
const { default: audioExport } = await import("../studioAudioExport.js");
const payload = new Blob([new Uint8Array([1, 2, 3, 4, 5, 6])], { type: "audio/wav" });
const binary = String.fromCharCode(...new Uint8Array(await payload.arrayBuffer()));
const encoded = btoa(binary);
const imported = await sampler.importAssets([{
  id: "sample-portable-1",
  name: "Portable Kick",
  fileName: "portable-kick.wav",
  type: "audio/wav",
  size: payload.size,
  data: encoded
}]);
assert.equal(imported, 1);
const listed = await sampler.list();
assert.equal(listed.length, 1);
assert.equal(listed[0].name, "Portable Kick");

sampler.assign("A", 1, "sample-portable-1");
sampler.setPadSettings("A", 1, { start: 0.1, end: 0.8, pitch: 1.25, decay: 0.7, volume: 0.65, pan: -0.3 });
const state = sampler.exportState();
assert.equal(state.assignments["A-1"], "sample-portable-1");
assert.equal(state.padSettings["A-1"].pan, -0.3);

const assets = await sampler.exportAssets(["sample-portable-1", "sample-portable-1"]);
assert.equal(assets.length, 1);
assert.equal(assets[0].data, encoded);

const audio = new AudioMock();
await sampler.play("sample-portable-1", audio, {
  start: 0.1, end: 0.8, pitch: 1.25, decay: 0.2,
  velocity: 0.75, volume: 0.6, pan: -0.4, when: 1.2
});
const source = audio.nodes.find(node => node.kind === "buffer-source");
const panner = audio.nodes.find(node => node.kind === "panner");
assert.ok(source, "Imported sample creates an audio buffer source");
assert.equal(source.playbackRate.value, 1.25);
assert.equal(source.startArgs[0], 1.2, "Imported sample respects the scheduled audio-clock time");
assert.equal(source.startArgs[1], 0.2, "Imported sample respects its trim start");
assert.ok(panner, "Imported sample supports stereo pan");
assert.equal(panner.pan.value, -0.4);
assert.ok(audioExport.output, "Imported samples connect to the shared studio output");

sampler.unassign("A", 1);
assert.equal(sampler.getAssignment("A", 1), null);
await sampler.remove("sample-portable-1");
assert.equal((await sampler.list()).length, 0);

console.log("MPC sample storage, assignments, settings, and portable asset tests passed.");
