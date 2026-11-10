import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [engine, main, world, drums, navigation, workspace] = await Promise.all([
  readFile(new URL("../engine.js", import.meta.url), "utf8"),
  readFile(new URL("../main.js", import.meta.url), "utf8"),
  readFile(new URL("../recordsHQFloor2Studio.js", import.meta.url), "utf8"),
  readFile(new URL("../floor2DrumStation.js", import.meta.url), "utf8"),
  readFile(new URL("../floor2StudioNavigation.js", import.meta.url), "utf8"),
  readFile(new URL("../studioDAWWorkspace.js", import.meta.url), "utf8")
]);

const worldInit = main.indexOf('["recordsHQFloor2Studio", [engine.scene]]');
const drumInit = main.indexOf('["floor2DrumStation", [engine.scene, engine.context]]');
const navigationInit = main.indexOf('["floor2StudioNavigation", [engine.scene, engine.context]]');
const sessionInit = main.indexOf('["floor2StudioSession", [engine.scene, engine.context]]');
const mixConsoleInit = main.indexOf('["studioMixMasterConsole3D", [engine.scene, engine.context]]');
const liveDrummerInit = main.indexOf('["floor2LiveDrummer", [engine.scene, engine.context]]');
const vocalBoothInit = main.indexOf('["floor2VocalBooth3D", [engine.scene, engine.context]]');
const citySynthInit = main.indexOf('["floor2CitySynth", [engine.scene, engine.context]]');

assert.ok(main.includes('import("./recordsHQFloor2Studio.js")'),
  "Floor 2 architecture must load only when the elevator selects Floor 2");
assert.ok(worldInit >= 0, "Floor 2 room must initialize lazily");
assert.doesNotMatch(engine, /this\.systems\.recordsHQFloor2Studio\?\.init/,
  "Floor 2 architecture must not initialize during initial world startup");
assert.ok(drumInit > worldInit, "Drum station must initialize after the Floor 2 room");
assert.ok(navigationInit > drumInit, "Studio navigation must initialize after the drum station");
assert.ok(sessionInit > navigationInit, "Floor 2 session controller must initialize after navigation");
assert.ok(mixConsoleInit > sessionInit && liveDrummerInit > mixConsoleInit && vocalBoothInit > liveDrummerInit && citySynthInit > vocalBoothInit, "Four visual interface modules must initialize after the existing Floor 2 systems");

assert.match(world, /group\.userData\.studioStations\s*=\s*\{/);
assert.match(drums, /station\.name\s*=\s*"floor2DrumStation"/);
assert.match(drums, /studio\.userData\.studioStations\.drumStation\s*=\s*station/);
assert.match(navigation, /floor2SongEditorDisplay/);
assert.match(navigation, /view:\s*"edit"/);
assert.doesNotMatch(navigation, /object:\s*stations\.(?:drumStation|instrumentStation|controlRoom)/);
const workflowOrder = [
  /id:\s*"edit",\s*label:\s*"EDITING"/,
  /id:\s*"mpc",\s*label:\s*"MPC"/,
  /id:\s*"piano",\s*label:\s*"PIANO \/ CITY SYNTH"/,
  /id:\s*"vocals",\s*label:\s*"VOCAL BOOTH"/,
  /id:\s*"beatlab",\s*label:\s*"BEAT LAB"/
];
let previousIndex = -1;
for (const pattern of workflowOrder) {
  const index = workspace.search(pattern);
  assert.ok(index > previousIndex, "Primary workflow must remain EDIT → MPC → PIANO → VOCALS → BEAT LAB");
  previousIndex = index;
}
assert.match(workspace, /data-daw-navigation-label/);
assert.match(workspace, /data-daw-step="-1"/);
assert.match(workspace, /data-daw-step="1"/);
assert.match(workspace, /ALL_VIEWS/);
assert.doesNotMatch(workspace, /data-daw-secondary|data-daw-view=|data-flow-step/,
  "Studio navigation must not expose a numbered workflow or destination menu.");

console.log("Floor 2 Studio station registration and navigation checks passed.");
