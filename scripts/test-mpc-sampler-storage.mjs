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

const { default: sampler } = await import("../studioMPCSampler.js");
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

sampler.unassign("A", 1);
assert.equal(sampler.getAssignment("A", 1), null);
await sampler.remove("sample-portable-1");
assert.equal((await sampler.list()).length, 0);

console.log("MPC sample storage, assignments, settings, and portable asset tests passed.");
