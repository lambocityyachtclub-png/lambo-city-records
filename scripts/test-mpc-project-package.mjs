import assert from "node:assert/strict";
import {
  exportSongProjectPackage,
  importSongProjectPackage
} from "../studioProjectPackage.js";

const steps = () => Array.from({ length: 16 }, () => false);
const project = {
  schemaVersion: 1,
  id: "test-song",
  metadata: { title: "MPC Package Test" },
  settings: { bpm: 100, soundProfile: "mpc" },
  patterns: [{
    id: "pattern-main",
    name: "Main",
    bpm: 100,
    steps: { kick: steps(), snare: steps(), hat: steps() }
  }],
  arrangement: {
    sections: [{ id: "section-intro", name: "Intro", order: 0, bars: 1, clips: [] }]
  },
  mpcPerformance: {
    events: [{
      pad: 1,
      bank: "A",
      soundId: "DEMO-001",
      sampleId: "user-sample-test",
      sampleSettings: { start: 0.1, end: 0.9, pitch: 1.05946, decay: 0.8, volume: 1.2, pan: -0.35 },
      velocity: 0.82,
      at: 0.25,
      sound: {
        id: "DEMO-001",
        name: "Test Kick",
        family: "kick",
        seed: 1,
        frequency: 60,
        decay: 0.2,
        brightness: 0.5
      }
    }],
    duration: 2
  },
  mpcAssets: [{
    id: "user-sample-test",
    name: "Test Sample",
    fileName: "test.wav",
    type: "audio/wav",
    size: 4,
    data: "AQIDBA=="
  }],
  mpcSamplerState: {
    assignments: { "A-1": "user-sample-test" },
    padSettings: { "A-1": { start: 0.1, end: 0.9, pitch: 1.05946, decay: 0.8, volume: 1.2, pan: -0.35 } }
  },
  mpcLibraryAssignments: { "A-2": "DEMO-002" },
  mpcLibrarySounds: [{
    id: "DEMO-002",
    name: "ROUND 808 002",
    family: "bass",
    style: "HARD 808 LOW END",
    influence: "Original low-end design",
    tone: "ROUND",
    seed: 2,
    frequency: 72,
    decay: 0.2,
    brightness: 0.55,
    locked: false
  }]
};

const packageText = exportSongProjectPackage(project);
const imported = importSongProjectPackage(packageText);
assert.equal(imported.mpcPerformance.events[0].sampleId, "user-sample-test");
assert.equal(imported.mpcPerformance.events[0].velocity, 0.82);
assert.equal(imported.mpcPerformance.events[0].sampleSettings.volume, 1.2);
assert.equal(imported.mpcPerformance.events[0].sampleSettings.pan, -0.35);
assert.equal(imported.mpcAssets[0].data, "AQIDBA==");
assert.equal(imported.mpcSamplerState.assignments["A-1"], "user-sample-test");
assert.equal(imported.mpcLibraryAssignments["A-2"], "DEMO-002");
assert.equal(imported.mpcLibrarySounds[0].id, "DEMO-002");
assert.equal(imported.mpcLibrarySounds[0].frequency, 72);

const missingAssetProject = structuredClone(project);
missingAssetProject.mpcAssets = [];
missingAssetProject.mpcSamplerState.assignments["B-1"] = "missing-pad-sample";
assert.throws(
  () => exportSongProjectPackage(missingAssetProject),
  /sample that is missing/
);

const noAssetFieldProject = structuredClone(project);
delete noAssetFieldProject.mpcAssets;
assert.throws(
  () => exportSongProjectPackage(noAssetFieldProject),
  /does not include the audio assets/
);

console.log("MPC project package tests passed.");
