import assert from "node:assert/strict";

const memory = new Map();
globalThis.localStorage = {
  getItem(key) { return memory.has(key) ? memory.get(key) : null; },
  setItem(key, value) { memory.set(key, String(value)); },
  removeItem(key) { memory.delete(key); }
};

const { default: library } = await import("../studioMPCLibrary.js");
const first = library.open();
assert.equal(first.added, 20);
assert.equal(first.sounds.length, 120);
assert.equal(new Set(first.sounds.map(sound => sound.id)).size, first.sounds.length);

const second = library.open();
assert.equal(second.sounds.length, 140);
assert.equal(new Set(second.sounds.map(sound => sound.id)).size, second.sounds.length);
assert.equal(second.sounds[0].id, first.sounds[0].id);
assert.equal(second.sounds[119].id, first.sounds[119].id);

assert.equal(library.unlock("LAMBO-LOCAL-TEST"), true);
const unlocked = library.getSounds();
assert.equal(unlocked.length, 340);
assert.equal(new Set(unlocked.map(sound => sound.id)).size, unlocked.length);

library.assign("B", 4, unlocked[25].id);
assert.equal(library.getAssignment("B", 4).id, unlocked[25].id);
library.importAssignments({ "A-1": unlocked[0].id });
assert.equal(library.getAssignment("A", 1).id, unlocked[0].id);
assert.equal(library.exportAssignments()["A-1"], unlocked[0].id);

console.log("MPC sound library tests passed.");
