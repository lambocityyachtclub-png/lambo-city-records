import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [engine, world, drums, navigation, workspace] = await Promise.all([
  readFile(new URL("../engine.js", import.meta.url), "utf8"),
  readFile(new URL("../recordsHQFloor2Studio.js", import.meta.url), "utf8"),
  readFile(new URL("../floor2DrumStation.js", import.meta.url), "utf8"),
  readFile(new URL("../floor2StudioNavigation.js", import.meta.url), "utf8"),
  readFile(new URL("../studioDAWWorkspace.js", import.meta.url), "utf8")
]);

const worldInit = engine.indexOf("this.systems.recordsHQFloor2Studio?.init?.(this.scene)");
const drumInit = engine.indexOf("this.systems.floor2DrumStation?.init?.(");
const navigationInit = engine.indexOf("this.systems.floor2StudioNavigation?.init?.(");
const sessionInit = engine.indexOf("this.systems.floor2StudioSession?.init?.(");
const mixConsoleInit = engine.indexOf("this.systems.studioMixMasterConsole3D?.init?.(");
const liveDrummerInit = engine.indexOf("this.systems.floor2LiveDrummer?.init?.(");
const vocalBoothInit = engine.indexOf("this.systems.floor2VocalBooth3D?.init?.(");
const citySynthInit = engine.indexOf("this.systems.floor2CitySynth?.init?.(");

assert.ok(worldInit >= 0, "Floor 2 room must initialize");
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
