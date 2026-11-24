import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync(new URL("../characterSystem.js", import.meta.url), "utf8");
assert.match(source, /getPlaybackClock/);
assert.match(source, /animationTime = musicPlaying \? clock\.currentTime : elapsed/);
assert.match(source, /Math\.PI \* 2 \/ \(60 \/ 126\)/);
assert.match(source, /updateWalking\(character, safeDelta, context, musicBoost, animationTime\)/);
assert.match(source, /chooseWanderTarget\(character, context, animationTime\)/);
console.log("Concert crowd song synchronization checks passed.");
