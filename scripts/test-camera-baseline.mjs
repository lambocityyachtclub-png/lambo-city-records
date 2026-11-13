import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const camera = await readFile(new URL("../camera.js", import.meta.url), "utf8");

assert.match(camera, /camera\.position\.set\(0,\s*8,\s*14\)/,
  "The camera must initialize from the approved elevated starting pose.");
assert.match(camera, /const startupWideView = !insideHQ && !hasMoved && !closeFraming/,
  "The first outdoor view must use the dedicated wide startup composition.");
assert.match(camera, /startupWideView \? 17\.0 : 15\.5/,
  "The startup distance must remain 17, then use the established 15.5 roaming distance.");
assert.match(camera, /startupWideView \? 8\.0 : 7\.2/,
  "The startup height must remain 8, then use the established 7.2 roaming height.");
assert.match(camera, /isNearExistingCharacter\(player, npcSystem\)/,
  "The close camera framing must return near existing characters.");
assert.match(camera, /isNearBuilding\(player\)/,
  "The close camera framing must return near existing buildings.");
assert.match(camera, /const ROOM_CEILING_Y = 17\.85/,
  "Floor 2's seated camera must retain its ceiling boundary.");
assert.match(camera, /ROOM_MIN_X[\s\S]*?ROOM_MAX_X[\s\S]*?ROOM_MIN_Z[\s\S]*?ROOM_MAX_Z/,
  "Floor 2's seated camera must retain its room perimeter boundaries.");

console.log("PASS: approved camera startup and Floor 2 camera-boundary checks");
