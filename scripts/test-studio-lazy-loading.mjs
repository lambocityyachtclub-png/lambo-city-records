import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const [main, engine] = await Promise.all([
  readFile(resolve(root, "main.js"), "utf8"),
  readFile(resolve(root, "engine.js"), "utf8")
]);

const floor2Modules = [
  "recordsHQFloor2Studio",
  "floor2StudioApp",
  "floor2InstrumentApp",
  "floor2DrumStation",
  "floor2StudioNavigation",
  "floor2StudioSession",
  "studioMixMasterConsole3D",
  "floor2LiveDrummer",
  "floor2VocalBooth3D",
  "floor2CitySynth"
];

for (const moduleName of floor2Modules) {
  const staticImport = new RegExp(
    String.raw`import\\s+[^;]+from\\s+["']\\./${moduleName}\\.js["']`
  );
  const lazyImport = new RegExp(
    String.raw`import\\(["']\\./${moduleName}\\.js["']\\)`
  );
  assert.doesNotMatch(main, staticImport,
    moduleName + " must not be statically loaded with the initial world");
  assert.match(main, lazyImport,
    moduleName + " must be dynamically loaded when Floor 2 is selected");
}

assert.match(main, /floor !== 2 && floor !== 3 && floor !== 4/,
  "Floor 2 loading must be an explicit destination action");
assert.match(main, /window\\.__lamboCityFloor2Ready = true/,
  "Floor 2 readiness must be published only after initialization");
assert.match(main, /await Promise\\.resolve\\(systems\\[name\\]\\.init\\(\\.\\.\\.args\\)\\)/,
  "the elevator must wait for asynchronous Studio initialization");
assert.match(main, /window\\.__lamboCityFloor2Ready = false/,
  "Floor 2 must be marked unavailable while loading");

for (const moduleName of floor2Modules) {
  const startupInit = new RegExp(
    String.raw`this\\.systems\\.${moduleName}\\?\\.init`
  );
  assert.doesNotMatch(engine, startupInit,
    moduleName + " must not initialize during the initial engine boot");
}

console.log("Floor 2 lazy-loading checks passed: Studio architecture, DAW, instruments, session, and enhancements load only on destination entry.");
