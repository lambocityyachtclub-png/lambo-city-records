import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [engine, main, input, elevator, phoneNavigation, world, drums, navigation, workspace, studioApp, mixMaster, liveDrummer, vocalBooth, citySynth] = await Promise.all([
  readFile(new URL("../engine.js", import.meta.url), "utf8"),
  readFile(new URL("../main.js", import.meta.url), "utf8"),
  readFile(new URL("../input.js", import.meta.url), "utf8"),
  readFile(new URL("../recordsHQElevator.js", import.meta.url), "utf8"),
  readFile(new URL("../floor2PhoneNavigation.js", import.meta.url), "utf8"),
  readFile(new URL("../recordsHQFloor2Studio.js", import.meta.url), "utf8"),
  readFile(new URL("../floor2DrumStation.js", import.meta.url), "utf8"),
  readFile(new URL("../floor2StudioNavigation.js", import.meta.url), "utf8"),
  readFile(new URL("../studioDAWWorkspace.js", import.meta.url), "utf8"),
  readFile(new URL("../floor2StudioApp.js", import.meta.url), "utf8"),
  readFile(new URL("../studioMixMasterConsole3D.js", import.meta.url), "utf8"),
  readFile(new URL("../floor2LiveDrummer.js", import.meta.url), "utf8"),
  readFile(new URL("../floor2VocalBooth3D.js", import.meta.url), "utf8"),
  readFile(new URL("../floor2CitySynth.js", import.meta.url), "utf8")
]);

const floor2Loader = main.slice(
  main.indexOf("window.__lamboCityPrepareFloor = floor => {"),
  main.indexOf("\nengine.init();")
);
const order = floor2Loader.slice(floor2Loader.indexOf("const initializationOrder = ["));
const worldInit = order.indexOf('["recordsHQFloor2Studio", [engine.scene]]');
const drumInit = order.indexOf('["floor2DrumStation", [engine.scene, engine.context]]');
const navigationInit = order.indexOf('["floor2StudioNavigation", [engine.scene, engine.context]]');
const sessionInit = order.indexOf('["floor2StudioSession", [engine.scene, engine.context]]');
const mixConsoleInit = order.indexOf('["studioMixMasterConsole3D", [engine.scene, engine.context]]');
const liveDrummerInit = order.indexOf('["floor2LiveDrummer", [engine.scene, engine.context]]');
const vocalBoothInit = order.indexOf('["floor2VocalBooth3D", [engine.scene, engine.context]]');
const citySynthInit = order.indexOf('["floor2CitySynth", [engine.scene, engine.context]]');

assert.ok(worldInit >= 0, "Floor 2 room must initialize on demand");
assert.ok(drumInit > worldInit, "Drum station must initialize after the Floor 2 room");
assert.ok(navigationInit > drumInit, "Studio navigation must initialize after the drum station");
assert.ok(sessionInit > navigationInit, "Floor 2 session controller must initialize after navigation");
assert.ok(mixConsoleInit > sessionInit && liveDrummerInit > mixConsoleInit && vocalBoothInit > liveDrummerInit && citySynthInit > vocalBoothInit, "Four visual interface modules must initialize after the existing Floor 2 systems");
assert.doesNotMatch(engine, /this\.systems\.(?:recordsHQFloor2Studio|floor2DrumStation|floor2StudioNavigation|floor2StudioSession|studioMixMasterConsole3D|floor2LiveDrummer|floor2VocalBooth3D|floor2CitySynth)\?\.init/, "Floor 2 modules must not initialize during the initial world startup");
assert.match(floor2Loader, /window\.__lamboCityFloor2Ready = true/);
assert.match(floor2Loader, /engine\.scene\.getObjectByName\("recordsHQFloor2Studio"\)/);
assert.match(input, /id\s*=\s*"lambo-city-joystick"/, "The iPad joystick must remain part of the input system");
assert.match(input, /phone\.querySelector\("#lambo-phone-studio"\)[\s\S]*?navigateFromPhone\(2\)/, "The phone Studio tile must route to Floor 2");
assert.match(input, /const navigateFromPhone = floor => \{[\s\S]*?window\.__lamboCityNavigateToFloor[\s\S]*?navigate\(floor\)/, "Phone shortcuts must use the shared elevator navigation path");
assert.match(elevator, /createPhoneFloorNavigator/);
assert.match(elevator, /isFloor2Discovered:\s*\(\)\s*=>\s*window\.__lamboCityFloor2Discovered === true/);
assert.match(phoneNavigation, /getPrepareFloor\(\)/, "A discovered Floor 2 shortcut must load its session before direct entry");
assert.match(phoneNavigation, /prepareFloor\(2\)/, "The returning phone shortcut must prepare Floor 2 on demand");
assert.match(phoneNavigation, /if \(hasDirectEntry\(\)\)/, "The cockpit shortcut must check for its session hook before direct entry.");
assert.match(phoneNavigation, /enterDirect\(\) === true/, "The cockpit shortcut must confirm that direct entry actually succeeded.");
assert.match(phoneNavigation, /selectOrQueue\(2\)/, "A failed direct-entry preload must retain the physical elevator fallback.");
assert.match(elevator, /let travelStartPending = false/,
  "The phone shortcut must queue a trip if the first player update has not arrived yet.");
assert.match(elevator, /function startTravel\(player = getPlayer\(\)\)/,
  "Elevator travel must accept the player supplied by the first ready update.");
assert.match(elevator, /if \(travelStartPending\) \{\s*travelStartPending = false;\s*startTravel\(player\);\s*\}/,
  "A queued phone trip must resume automatically when the player becomes ready.");
assert.match(elevator, /isBusy: \(\) =>[\s\S]*?travelStartPending[\s\S]*?window\.__lamboCityFloor2SessionMode === "arrival"/, "Phone requests must queue while travel, landing, or Floor 2 arrival is active.");
assert.match(elevator, /Boolean\(floor3AutoArrival\)/,
  "The Studio shortcut must not interrupt an active Floor 3 arrival.");
assert.match(elevator, /failedReturnDoorPending/,
  "The Studio shortcut must not interrupt a pending return-door transition.");
assert.match(phoneNavigation, /queuedDestination = destination/, "Busy phone requests must retain the requested destination.");
assert.match(phoneNavigation, /navigate\.flush = \(\) =>/, "Queued phone requests must expose a safe idle-time flush.");
assert.match(elevator, /window\.__lamboCityNavigateToFloor\?\.flush\?\.\(\)/, "The elevator must resume queued phone requests when it becomes idle.");
assert.match(elevator, /window\.__lamboCityPrepareFloor\?\.\(selectedFloor\)/, "Elevator travel must wait for the destination loader");
assert.match(elevator, /window\.__lamboCityBeginFloor2Session\?\.\(arrivedPlayer\)/, "Floor 2 arrival must open the Studio session");
assert.ok(engine.indexOf('this.initSystem("input", this.scene, this.context);') >= 0 && engine.indexOf('this.initSystem("input", this.scene, this.context);') < engine.indexOf('this.initSystem("performanceMonitor", this.renderer, this.context);'), "iPad input and joystick must initialize immediately after the core renderer/context");

assert.match(studioApp, /THREE = context\\?\\.THREE/,
  "Floor 2 Studio must use the world's shared Three.js runtime when available.");
assert.match(studioApp, /await import\\(["']https:\\/\\/unpkg\\.com\\/three@0\\.160\\.0/,
  "Standalone Studio may lazily load Three.js for its presentation wrapper.");

for (const [name, source] of [
  ["Mix and Master console", mixMaster],
  ["Live Drummer", liveDrummer],
  ["Vocal Booth", vocalBooth],
  ["City Synth", citySynth]
]) {
  assert.doesNotMatch(source, /unpkg\\.com\\/three@0\\.160\\.0/,
    `${name} must not fetch a second Three.js runtime`);
  assert.match(source, /THREE = context\\?\\.THREE/,
    `${name} must use the shared Three.js context`);
}

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

assert.match(engine, /initSystem\(name, \.\.\.args\)/,
  "The engine must expose an idempotent initializer for streamed modules.");
assert.match(engine, /this\.systems\[name\] = new Proxy/,
  "The engine must isolate newly registered modules.");
assert.match(engine, /this\.context\.systems = this\.systems/,
  "The live context must retain the merged engine registry.");
assert.match(main, /engine\.registerSystems\(systems\)/,
  "All streamed upper-floor modules must merge into the live engine registry.");
assert.match(main, /engine\.initSystem\(name, \.\.\.args\)/,
  "Streamed upper-floor modules must use the engine's isolated initializer with their scene/context arguments.");
assert.match(main, /await Promise\.resolve\(engine\.initSystem\(name, \.\.\.args\)\)/,
  "Every streamed Studio module must finish initialization before the elevator completes arrival.");
assert.match(main, /window\.__lamboCityFloor2InitProgress\.push\(name\)/,
  "Floor 2 must record successful module initialization in order.");
