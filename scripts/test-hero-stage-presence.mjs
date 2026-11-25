import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../heroPerformance.js", import.meta.url), "utf8");
const start = source.indexOf("function beginPerformance(context)");
const end = source.indexOf("function updateEntering", start);
assert.ok(start >= 0 && end > start, "The existing stage performance entry must remain present");
const begin = source.slice(start, end);
assert.match(begin, /hero\.position\.copy\(STAGE_LEFT\)/,
  "HERO must still enter from the approved stage-left mark");
assert.match(begin, /hero\.visible = true/,
  "HERO must remain visible while the audio system initializes");
const waiting = source.slice(source.indexOf('if (state === "WAITING_FOR_AUDIO")'));
assert.match(waiting, /hero\.visible = true[\s\S]*StageMusic\.isPlaying\(\)/,
  "Audio readiness must not hide HERO while waiting for playback");
console.log("HERO stage presence checks passed.");
