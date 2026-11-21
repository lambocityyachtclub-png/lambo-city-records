import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [app, beatLab, edit, playback, multitrack] = await Promise.all([
  readFile(new URL("../studioDAWApp.js", import.meta.url), "utf8"),
  readFile(new URL("../floor2StudioApp.js", import.meta.url), "utf8"),
  readFile(new URL("../studioDAWEditScreen.js", import.meta.url), "utf8"),
  readFile(new URL("../studioDAWArrangementPlayback.js", import.meta.url), "utf8"),
  readFile(new URL("../studioMultitrackWorkspace.js", import.meta.url), "utf8")
]);

assert.match(app, /One shared Spacebar transport for every Studio workspace/);
assert.match(app, /event\.code !== "Space"/);
assert.match(app, /multitrack\.playAll\(\)/);
assert.match(app, /StudioMultitrackWorkspace\?\.stopAll\(\)/);
assert.match(app, /startSessionPlayback\(\)/);
assert.match(app, /data-global-transport="return"/, "The shared transport must expose Return-to-Start in every workspace.");
assert.match(app, /action === "return"/, "Return-to-Start must be wired to the shared transport handler.");
assert.match(app, /returnSessionToStart\(\)/, "Return-to-Start must use one shared session action.");
assert.match(app, /workspace\.playheadBar = 1/, "Return-to-Start must return the shared playhead to bar 1.");
assert.match(app, /cycleRecordingEnabled: true/, "Cycle Takes must be enabled by default.");
assert.match(app, /StudioMultitrackWorkspace\.cycleTakesEnabled = this\.cycleRecordingEnabled/, "Cycle Takes must be stored on the shared session.");
assert.match(app, /this\.cycleRecordingEnabled = StudioMultitrackWorkspace\.cycleTakesEnabled !== false/, "Cycle Takes must restore from the shared session.");
assert.match(playback, /hasUpcomingArrangementContent/, "Empty sessions must keep the song clock moving.");
assert.match(playback, /: 129;/, "An empty session without a loop must continue to the end of the song timeline.");
assert.match(app, /this\.cycleRecordingActive && this\.cycleRecordingEnabled && bounds/, "Cycle Takes must remain active across completed loop passes only while Cycle Takes is enabled and loop bounds remain available.");
assert.match(app, /this\.cycleRestartTimer = setTimeout/, "Each completed pass must schedule the next take.");
assert.match(app, /punchInBar: bounds\.startBar/);
assert.match(app, /punchOutBar: bounds\.endBar/);
assert.match(multitrack, /const takeGroupId = track\.id \+ "-takes-" \+ this\.recordingStartBar/);
assert.match(multitrack, /takeNumber: track\.clips\.filter\(clip => clip\.takeGroupId === takeGroupId\)\.length \+ 1/);
assert.match(multitrack, /compSelectedTake\(\)/, "The Edit timeline must retain non-destructive take comping.");
assert.match(app, /await beatLab\.start\(\{/);
assert.match(app, /startAtTime:\s*multitrack\.arrangementPlayback\?\.playbackStartTime/);
assert.match(beatLab, /async start\(\{\s*startAtTime = null,\s*startAtStep = 0\s*\} = \{\}\)/);
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
