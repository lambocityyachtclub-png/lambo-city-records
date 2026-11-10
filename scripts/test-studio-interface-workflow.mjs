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
  "mpc-interface.js",
  "studioMultitrackWorkspace.js",
  "floor2StudioApp.js"
];
const source = Object.fromEntries(await Promise.all(files.map(async file => [
  file,
  await readFile(new URL("../" + file, import.meta.url), "utf8")
])));

const main = source["main.js"];
const engine = source["engine.js"];
for (const [name,systemKey,binding] of [
  ["StudioMixMasterConsole3D","studioMixMasterConsole3D","mixMaster"],
  ["Floor2LiveDrummer","floor2LiveDrummer","liveDrummer"],
  ["Floor2VocalBooth3D","floor2VocalBooth3D","vocalBooth"],
  ["Floor2CitySynth","floor2CitySynth","citySynth"]
]) {
  assert.ok(main.includes('import("./' + systemKey + '.js")'),
    name + " must be dynamically imported when Floor 2 is selected");
  assert.ok(main.includes(systemKey + ": " + binding + ".default"),
    name + " must be registered with the engine after its lazy import");
  assert.ok(main.includes('["' + systemKey + '", [engine.scene, engine.context]]'),
    name + " must initialize after the Floor 2 architecture is ready");
  assert.equal(engine.includes('initialize("' + systemKey + '"'), false,
    name + " must not initialize during initial world startup");
}

const workspace = source["studioDAWWorkspace.js"];
const orderedSteps = [
  /id:\s*"edit",\s*label:\s*"EDITING"/,
  /id:\s*"mpc",\s*label:\s*"MPC"/,
  /id:\s*"drums",\s*label:\s*"LIVE DRUMMER"/,
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
assert.match(workspace,/const SECONDARY_VIEWS = \[\];/,"Live Drummer must be a first-class navigable destination.");
assert.match(workspace,/data-daw-navigation-label/);
assert.match(workspace,/aria-label="Studio workspace navigation"/);
assert.match(workspace,/data-daw-step="-1"/);
assert.match(workspace,/data-daw-step="1"/);
assert.doesNotMatch(workspace,/data-daw-view=/,"Studio navigation must not render a list of named workflow destinations.");
assert.doesNotMatch(workspace,/data-flow-step=|lc-daw-flow-track|data-daw-secondary=/,"Do not show numbered workflow steps or footer destination menus.");
assert.match(workspace,/workflowNav\?\.addEventListener\("pointerup"/);
assert.match(workspace,/lc-daw-edit-mode \.lc-daw-navigation \{/);
assert.doesNotMatch(workspace,/lc-daw-edit-mode \.lc-daw-navigation,\s*#/);

const navigation = source["floor2StudioNavigation.js"];
assert.match(navigation,/floor2SongEditorDisplay/);
assert.match(navigation,/view:\s*"edit"/);
assert.match(navigation,/floor2RecordingBooth/,"The physical Floor 2 Vocal Booth must be a direct station target.");
assert.match(navigation,/view:\s*"vocals"/,"Selecting the physical Vocal Booth must open the VOCAL BOOTH workspace.");
assert.match(navigation,/StudioDAWApp\.open\(station\.view\s*\|\|\s*"edit"\)/,"Physical station entry points must reuse the shared DAW app.");
assert.doesNotMatch(navigation,/object:\s*stations\.(?:drumStation|instrumentStation|controlRoom)/);

const app = source["studioDAWApp.js"];
assert.match(source["hud.js"],/lc-live-drummer-score/);
assert.match(source["hud.js"],/lc-live-drummer-state/);
assert.match(app,/lc-live-drummer-state/);
assert.match(source["floor2InstrumentApp.js"],/localHit\.x/);
assert.match(source["floor2InstrumentApp.js"],/getTrackGain\("instrument"\)/);
assert.match(source["floor2CitySynth.js"],/floor2CitySynthBlackKey/);
assert.match(app,/createLiveDrummerPanel\(\{ beatLab: Floor2StudioApp \}\)/);
assert.match(app,/StudioMultitrackWorkspace\.resetSession\(\)/,"A fresh Studio launch must begin with a clean working session.");
assert.match(app,/Floor2StudioApp\.startNewSession\?\.\(\)/,"A fresh Studio launch must also reset the Beat Lab song state.");
assert.match(source["floor2StudioApp.js"],/startNewSession\(\)[\s\S]*?this\.currentProject = null;[\s\S]*?this\.pattern = makeDefaultPattern\(\)/);
assert.match(source["studioMultitrackWorkspace.js"],/this\.activeProjectId = null;/,"New Session must detach from the previously opened saved project.");
assert.match(source["studioMultitrackWorkspace.js"],/this\.activeProjectName = "Untitled Song"/);
const drummer = source["floor2LiveDrummer.js"];
assert.match(drummer,/data-drum-mode-toggle/,"Live Drummer must switch modes inside the same interface.");
assert.match(drummer,/SAMPLE PADS/);
assert.match(drummer,/LIVE PERFORMANCE/);
assert.match(app,/createCitySynthPanel\(\{ session: StudioMultitrackWorkspace \}\)/);
assert.match(app,/createVocalBoothPanel\(\{ beatLab: Floor2StudioApp \}\)/);
const vocalBooth = source["floor2VocalBooth3D.js"];
assert.match(vocalBooth,/data-booth-mode-switch="vocal"/,"Vocal Booth must have a one-tap return to full recording mode.");
assert.match(vocalBooth,/data-booth-mode-switch="notes"/,"Vocal Booth must have a one-tap Voice Notes mode.");
assert.match(vocalBooth,/data-booth-mode="notes" hidden/,"Voice Notes must be a separate mode, not a second panel stacked beside vocal recording.");
assert.match(vocalBooth,/data-booth-mode="vocal"/,"Full vocal recording controls must be scoped to Vocal Booth mode.");
assert.match(vocalBooth,/data-vocal-talkback/,"The dedicated Talkback control must remain available in the booth.");
assert.match(vocalBooth,/StudioTalkback\.bindControl/,"Talkback must use the shared Talkback service.");
assert.match(vocalBooth,/startTrackRecording\(\{audio,trackId:track\.id,shouldCancel:\(\)=>panelDisposed\|\|Boolean\(beatLab\?\.recordingStopPending\)\}\)/,"Voice Notes must record into the shared multitrack session with disposal cancellation.");
assert.match(vocalBooth,/stopTrackRecording\(trackId\)/,"Voice Notes must save a take into the shared session.");
assert.match(vocalBooth,/scheduleProjectAutosave\(\)/,"Voice Notes must autosave after saving a clip.");
assert.match(vocalBooth,/Finish and save the active recording before switching modes/,"Mode switching must not strand an active recording.");
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
assert.match(mpc,/data-mpc-bounce="combined"/,"MPC must offer a combined stereo WAV bounce.");
assert.match(mpc,/data-mpc-bounce="separate"/,"MPC must offer separate per-pad WAV bounces.");
assert.match(mpc,/renderMPCBounce\(/);
assert.match(mpc,/StudioMultitrackWorkspace\.addMPCBounce/);
assert.match(source["studioMultitrackWorkspace.js"],/addMPCBounce\(/);
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

console.log("Continuous studio navigation and linked MPC performance interface checks passed.");
