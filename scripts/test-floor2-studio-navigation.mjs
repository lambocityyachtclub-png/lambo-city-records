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

assert.ok(worldInit >= 0, "Floor 2 room must initialize");
assert.ok(drumInit > worldInit, "Drum station must initialize after the Floor 2 room");
assert.ok(navigationInit > drumInit, "Studio navigation must initialize after the drum station");

assert.match(world, /group\.userData\.studioStations\s*=\s*\{/);
assert.match(drums, /station\.name\s*=\s*"floor2DrumStation"/);
assert.match(drums, /studio\.userData\.studioStations\.drumStation\s*=\s*station/);
assert.match(navigation, /stations\.drumStation,\s*view:\s*"drums"/);
assert.match(navigation, /stations\.instrumentStation,\s*view:\s*"piano"/);
assert.match(navigation, /stations\.controlRoom,\s*view:\s*"mix"/);
assert.match(workspace, /id:\s*"drums"/);
assert.match(workspace, /id:\s*"piano"/);
assert.match(workspace, /id:\s*"mix"/);

console.log("Floor 2 Studio station registration and navigation checks passed.");
