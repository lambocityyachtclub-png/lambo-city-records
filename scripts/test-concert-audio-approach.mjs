import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
const music = read("stageMusic.js");
const ambient = read("ambientMusic.js");
const performance = read("heroPerformance.js");

assert.match(music, /APPROACH_START_DISTANCE = 55/, "Stage music should begin building from the 55-unit approach radius");
assert.match(music, /APPROACH_END_DISTANCE = 22/, "Approach audio should hand off at HERO's existing 22-unit trigger");
assert.match(music, /updateApproach\(distance\)/, "StageMusic must expose distance-based approach control");
assert.match(music, /audio\.loop = true/, "The approach preview must loop if the player takes time to approach");
assert.match(music, /audio\.volume = APPROACH_MIN_VOLUME/, "Approach audio must begin quietly");
assert.match(music, /APPROACH_MAX_VOLUME - APPROACH_MIN_VOLUME/, "Approach audio must ramp up with proximity");
assert.match(music, /window\.addEventListener\("pointerdown", unlockAudio, true\)/,
  "Stage audio must receive iPad pointer gestures during capture");
assert.match(music, /window\.addEventListener\("touchend", unlockAudio, true\)/,
  "Stage audio must receive iPad touch-end gestures during capture");
assert.match(ambient, /window\.addEventListener\("pointerdown", unlockOnce, true\)/,
  "Ambient radio must receive the first iPad pointer gesture during capture");
assert.match(ambient, /window\.addEventListener\("touchend", unlockOnce, true\)/,
  "Ambient radio must support iPad touch-end unlocking");
assert.match(music, /playFromStart\(\)[\s\S]*audio\.loop = false[\s\S]*audio\.currentTime = 0/, "HERO's actual performance must restart the track from 0:00");
assert.match(performance, /const TRIGGER_DISTANCE = 22/, "The existing HERO activation distance must remain unchanged");
assert.match(performance, /const APPROACH_DISTANCE = 55/, "The new audio approach zone must begin before HERO appears");
assert.match(performance, /StageMusic\.updateApproach\(distance\)/, "HERO performance controller must update the proximity audio");
assert.match(performance, /AmbientMusic\.pause\(\)/, "The city radio must yield while the stage approach track is audible");
assert.match(performance, /AmbientMusic\.resume\(\)/, "The city radio must return if the player leaves the approach zone or the performance ends");

console.log("Concert approach audio and existing HERO trigger checks passed.");
