import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const files = [
  "main.js",
  "studioDAWApp.js",
  "studioDAWWorkspace.js",
  "floor2StudioNavigation.js",
  "studioMixMasterConsole3D.js",
  "floor2LiveDrummer.js",
  "floor2VocalBooth3D.js",
  "floor2CitySynth.js",
  "studioDAWArrangementPlayback.js",
  "studioRecordingEngine.js",
  "mpc-interface.js"
];
const source = Object.fromEntries(await Promise.all(files.map(async file => [
  file,
  await readFile(new URL("../" + file, import.meta.url), "utf8")
])));

const main = source["main.js"];
for (const [name,path] of [
  ["StudioMixMasterConsole3D","./studioMixMasterConsole3D.js"],
  ["Floor2LiveDrummer","./floor2LiveDrummer.js"],
  ["Floor2VocalBooth3D","./floor2VocalBooth3D.js"],
  ["Floor2CitySynth","./floor2CitySynth.js"]
]) {
  assert.ok(main.includes('from "' + path + '"'), name + " must be imported by the world");
  assert.ok(main.includes(name + ": " + name), name + " must be registered with the engine");
}

const workspace = source["studioDAWWorkspace.js"];
const orderedSteps = [
  /id:\s*"edit",\s*label:\s*"EDITING"/,
  /id:\s*"mpc",\s*label:\s*"MPC"/,
  /id:\s*"piano",\s*label:\s*"PIANO \/ CITY SYNTH"/,
  /id:\s*"vocals",\s*label:\s*"VOCAL BOOTH"/,
  /id:\s*"beatlab",\s*label:\s*"BEAT LAB"/
];
let last = -1;
for (const pattern of orderedSteps) {
  const index = workspace.search(pattern);
  assert.ok(index > last, "Primary workflow order must be EDIT → MPC → PIANO → VOCALS → BEAT LAB");
  last = index;
}
assert.match(workspace,/const ALL_VIEWS = \[\.\.\.VIEWS, \.\.\.SECONDARY_VIEWS\]/);
assert.match(workspace,/data-daw-secondary="edit"/);
assert.match(workspace,/data-daw-secondary="mix"/);
assert.match(workspace,/data-daw-secondary="drums"/);
assert.match(workspace,/workflowNav\?\.addEventListener\("pointerup"/);

const navigation = source["floor2StudioNavigation.js"];
assert.match(navigation,/floor2SongEditorDisplay/);
assert.match(navigation,/view:\s*"edit"/);
assert.doesNotMatch(navigation,/object:\s*stations\.(?:drumStation|instrumentStation|controlRoom)/);

const app = source["studioDAWApp.js"];
assert.match(app,/createLiveDrummerPanel\(\{ beatLab: Floor2StudioApp \}\)/);
assert.match(app,/createCitySynthPanel\(\{ session: StudioMultitrackWorkspace \}\)/);
assert.match(app,/createVocalBoothPanel\(\{ beatLab: Floor2StudioApp \}\)/);
assert.match(app,/styleMixMasterPanel\(createStudioMixMasterApp/);
assert.match(app,/onNext:\s*\(\)\s*=>\s*this\.workspace\?\.setView\("piano"\)/);

const mpc = source["mpc-interface.js"];
assert.match(mpc,/data-mpc-next/);
assert.match(mpc,/onNext\?\.\(\)/);

const playback = source["studioDAWArrangementPlayback.js"];
assert.match(playback,/createAnalyser\(\)/);
assert.match(playback,/getTrackMeter\(trackId\)/);
const recording = source["studioRecordingEngine.js"];
assert.match(recording,/getInputWaveform\(\)/);

assert.match(source["studioMixMasterConsole3D.js"],/getTrackMeter/);
assert.match(source["floor2LiveDrummer.js"],/lc-live-drummer-score/);
assert.match(source["floor2VocalBooth3D.js"],/getInputWaveform/);
assert.match(source["floor2CitySynth.js"],/data-synth-filter/);

for (const file of ["studioMixMasterConsole3D.js","floor2LiveDrummer.js","floor2VocalBooth3D.js","floor2CitySynth.js"]) {
  assert.doesNotMatch(source[file],/^import \* as THREE/m,"Scene modules must lazy-load Three.js so standalone Studio stays independent.");
  assert.match(source[file],/async init\(scene/,"Each world feature must expose an init(scene) lifecycle.");
  assert.match(source[file],/update\(/,"Each world feature must expose an update lifecycle.");
}

console.log("Five-step workflow and four shared-session music interface checks passed.");
