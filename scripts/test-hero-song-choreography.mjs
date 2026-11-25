import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync(new URL("../heroPerformance.js", import.meta.url), "utf8");
assert.match(source, /StageMusic\.getPlaybackClock\(\)/, "HERO choreography must read the real stage playhead");
assert.match(source, /animateHeroToSong\(songTime\)/, "HERO body movement must be driven by song time");
assert.match(source, /collectHeroRig\(hero\)/, "HERO animation must bind to the existing named model pivots");
assert.match(source, /armL/);
assert.match(source, /armR/);
assert.match(source, /resetHeroDance\(\)/, "HERO pose must reset before exit and on reset");
assert.match(source, /PROVISIONAL_BPM = 126/, "Tempo remains explicitly provisional until audio analysis");
assert.match(source, /const TRIGGER_DISTANCE = 22/, "Keep the existing stage trigger distance");
const endedCheck = source.indexOf("if (StageMusic.hasEnded())");
const pausedGuard = source.indexOf("if (!clock.playing) return;");
assert.ok(endedCheck >= 0 && pausedGuard >= 0 && endedCheck < pausedGuard,
  "HERO must process the audio-ended event before returning for a paused audio clock");
console.log("HERO song-driven choreography checks passed.");
