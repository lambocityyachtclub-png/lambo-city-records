import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const files = [
  "main.js",
  "hud.js",
  "floor2InstrumentApp.js",
  "engine.js",
  "studioDAWApp.js",
  "studioDAWWorkspace.js",
  "floor2StudioNavigation.js",
  "studioMixMasterConsole3D.js",
  "floor2LiveDrummer.js",
  "floor2VocalBooth3D.js",
  "floor2CitySynth.js",
  "studioDAWArrangementPlayback.js",
  "studioRecordingEngine.js",
  "studioAudioEngine.js",
  "mpc-interface.js"
];
const source = Object.fromEntries(await Promise.all(files.map(async file => [
  file,
  await readFile(new URL("../" + file, import.meta.url), "utf8")
])));

const main = source["main.js"];
const engine = source["engine.js"];
for (const [name,path] of [
  ["StudioMixMasterConsole3D","./studioMixMasterConsole3D.js"],
  ["Floor2LiveDrummer","./floor2LiveDrummer.js"],
  ["Floor2VocalBooth3D","./floor2VocalBooth3D.js"],
  ["Floor2CitySynth","./floor2CitySynth.js"]
]) {
  assert.ok(main.includes('from "' + path + '"'), name + " must be imported by the world");
  const systemKey = name[0].toLowerCase() + name.slice(1);
  assert.ok(main.includes(systemKey + ": " + name), name + " must be registered with the engine");
  assert.ok(engine.includes("this.systems." + systemKey + "?.init?.(this.scene, this.context)"), name + " must initialize after the Floor 2 scene is ready");
}

const workspace = source["studioDAWWorkspace.js"];
const orderedSteps = [
  /id:\s*"edit",\s*label:\s*"EDITING"/,
  /id:\s*"mpc",\s*label:\s*"MPC"/,
  /id:\s*"piano",\s*label:\s*"PIANO \/ CITY SYNTH"/,
  /id:\s*"vocals",\s*label:\s*"VOCAL BOOTH"/,
  /id:\s*"beatlab",\s*label:\s*"BEAT LAB"/,
  /id:\s*"mix",\s*label:\s*"MIX & MASTER"/
];
let last = -1;
for (const pattern of orderedSteps) {
  const index = workspace.search(pattern);
  assert.ok(index > last, "Primary workflow order must be EDIT → MPC → PIANO → VOCALS → BEAT LAB → MIX & MASTER");
  last = index;
}
assert.match(workspace,/const ALL_VIEWS = \[\.\.\.VIEWS, \.\.\.SECONDARY_VIEWS\]/);
assert.match(workspace,/data-daw-view="\$\{view\.id\}"/);
assert.match(workspace,/data-daw-secondary="edit"/);
assert.match(workspace,/data-daw-secondary="mix"/);
assert.match(workspace,/data-daw-secondary="drums"/);
assert.match(workspace,/workflowNav\?\.addEventListener\("pointerup"/);
assert.match(workspace,/lc-daw-edit-mode \.lc-daw-navigation \{/);
assert.doesNotMatch(workspace,/lc-daw-edit-mode \.lc-daw-navigation,\s*#/);

const navigation = source["floor2StudioNavigation.js"];
assert.match(navigation,/floor2SongEditorDisplay/);
assert.match(navigation,/view:\s*"edit"/);
assert.doesNotMatch(navigation,/object:\s*stations\.(?:drumStation|instrumentStation|controlRoom)/);

const app = source["studioDAWApp.js"];
assert.match(source["hud.js"],/lc-live-drummer-score/);
assert.match(source["hud.js"],/lc-live-drummer-state/);
assert.match(app,/lc-live-drummer-state/);
assert.match(source["floor2InstrumentApp.js"],/localHit\.x/);
assert.match(source["floor2InstrumentApp.js"],/getTrackGain\("instrument"\)/);
assert.match(source["floor2CitySynth.js"],/floor2CitySynthBlackKey/);
assert.match(app,/createLiveDrummerPanel\(\{ beatLab: Floor2StudioApp \}\)/);
assert.match(app,/createCitySynthPanel\(\{ session: StudioMultitrackWorkspace \}\)/);
assert.match(app,/createVocalBoothPanel\(\{ beatLab: Floor2StudioApp \}\)/);
assert.match(app,/styleMixMasterPanel\(createStudioMixMasterApp/);
assert.match(app,/onNext:\s*\(\)\s*=>\s*this\.workspace\?\.setView\("piano"\)/);

const mpc = source["mpc-interface.js"];
assert.match(app,/performancePanel:\s*this\.mpcPanel/);
assert.match(mpc,/data-mpc-performance-open/,"MPC Performance must launch from the top of the original MPC hardware interface.");
assert.match(mpc,/<header class="mpc-nameplate">[\s\S]*?data-mpc-tools-toggle[\s\S]*?data-mpc-performance-open/,"MPC Performance must sit beside TOOLS in the MPC nameplate.");
assert.doesNotMatch(mpc,/data-mpc-open-performance/,"Do not leave a separate MPC Performance folder tile on the home display.");
assert.match(mpc,/data-mpc-return-hardware/);
assert.match(mpc,/data-mpc-pattern-host/);
assert.match(mpc,/data-mpc-panel="PATTERN"/);
assert.doesNotMatch(mpc,/data-mpc-tab="PATTERN"/,"MPC Performance is an internal MPC tool, not a top-level MPC tab.");
assert.match(mpc,/showPerformance\(\)/);
assert.match(mpc,/showHardware\(\)/);
assert.match(app,/onClose:\s*\(\)\s*=>\s*this\.workspace\?\.setView\("edit"\)/,"Closing the MPC hardware must return to Editing, not expose a separate MPC Performance workflow screen.");
assert.doesNotMatch(app,/host\.replaceChildren\(this\.mpcPanel\)/,"Do not restore MPC Performance as a standalone workflow panel.");
assert.match(mpc,/showPerformance\(\)/);
assert.match(mpc,/this\.showScreen\("PATTERN"\)/);
assert.doesNotMatch(mpc,/performanceView\.style\.display\s*=\s*"block"/,"MPC performance must stay inside the original hardware interface.");
assert.match(mpc,/showHardware\(\)/);
assert.match(mpc,/data-mpc-next/);
assert.match(mpc,/onNext\?\.\(\)/);

const playback = source["studioDAWArrangementPlayback.js"];
assert.match(playback,/createAnalyser\(\)/);
assert.match(playback,/getTrackMeter\(trackId\)/);
const recording = source["studioRecordingEngine.js"];
const audioEngine = source["studioAudioEngine.js"];
assert.match(audioEngine,/instrument:\s*context\.createGain\(\)/);
assert.match(audioEngine,/getInstrumentMeter\(\)/);
assert.match(source["floor2CitySynth.js"],/getTrackGain\("instrument"\)/);
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

console.log("Six-step workflow and linked MPC performance interface checks passed.");
