import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [app, beatLab, edit, playback] = await Promise.all([
  readFile(new URL("../studioDAWApp.js", import.meta.url), "utf8"),
  readFile(new URL("../floor2StudioApp.js", import.meta.url), "utf8"),
  readFile(new URL("../studioDAWEditScreen.js", import.meta.url), "utf8"),
  readFile(new URL("../studioDAWArrangementPlayback.js", import.meta.url), "utf8")
]);

assert.match(app, /One shared Spacebar transport for every Studio workspace/);
assert.match(app, /event\.code !== "Space"/);
assert.match(app, /multitrack\.playAll\(\)/);
assert.match(app, /StudioMultitrackWorkspace\?\.stopAll\(\)/);
assert.match(app, /startSessionPlayback\(\)/);
assert.match(app, /await beatLab\.start\(\{ startAtTime:/);
assert.match(beatLab, /async start\(\{ startAtTime = null \} = \{\}\)/);
assert.match(beatLab, /getTempoAtBar\(sessionBar\)/);
assert.match(beatLab, /getTimeSignatureAtBar\(sessionBar\)/);
assert.match(app, /Floor2StudioApp\.stop\(\)/);
assert.match(playback, /playbackStartTime/);
assert.match(edit, /this\.onTransportPlay/);
assert.match(edit, /this\.onTransportStop/);
assert.match(app, /beatLab\.stop\(\)/);
assert.match(app, /data-global-transport="click"/);
assert.match(app, /CLICK OFF/);
assert.match(app, /toggleSessionMetronome/);
assert.doesNotMatch(app, /const useArrangement =/);
assert.match(app, /document\.removeEventListener\("keydown", this\.handleStudioKeydown\)/);

assert.doesNotMatch(beatLab, /if \(event\.code === "Space"\)/);
assert.doesNotMatch(edit, /key === "spacebar"/);
assert.doesNotMatch(edit, /key === " "/);

console.log("Shared Studio Spacebar transport checks passed.");
