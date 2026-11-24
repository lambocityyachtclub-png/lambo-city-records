import assert from "node:assert/strict";
import fs from "node:fs";
const read = path => fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
const music = read("stageMusic.js");
const crowd = read("stageCrowdPulse.js");
const spots = read("stageSpotlights.js");
const lasers = read("stageLasers.js");
assert.match(music, /getPlaybackClock\(\)/);
assert.match(music, /audio\.currentTime/);
for (const [name, source] of [["crowd", crowd], ["spotlights", spots], ["lasers", lasers]]) {
  assert.match(source, /stageMusic\?\.getPlaybackClock/ , name + " must read the stage playback clock");
  assert.match(source, /clock\.currentTime|clock\?\.currentTime/, name + " must use the song playback position");
}
assert.match(crowd, /BEAT_BPM = 126/, "Keep the currently configured tempo grid explicit until track tempo is measured");
assert.match(lasers, /Keep lasers steady outside performances/, "Avoid rapid idle flashing");
console.log("Song-clock stage reaction checks passed.");
