import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [app, workspace, navigation, midiEditor] = await Promise.all([
  readFile(new URL("../studioDAWApp.js", import.meta.url), "utf8"),
  readFile(new URL("../studioDAWWorkspace.js", import.meta.url), "utf8"),
  readFile(new URL("../floor2StudioNavigation.js", import.meta.url), "utf8"),
  readFile(new URL("../studioDAWMidiEditor.js", import.meta.url), "utf8")
]);

assert.match(workspace, /id:\s*"vocals",\s*label:\s*"VOCAL BOOTH"/);
assert.match(navigation, /stations\.vocalBooth,\s*view:\s*"vocals"/);
assert.match(app, /this\.vocalsPanel\s*=\s*createVocalsPanel/);
assert.match(app, /setPanel\("vocals",\s*this\.vocalsPanel\)/);
assert.match(app, /data-vocal-action="quick-note-start"/);
assert.match(app, /data-vocal-action="quick-note-stop"/);
assert.match(app, /StudioRecordingEngine\.startTrackRecording\(\{\s*audio,\s*trackId:\s*quickNoteTrack\.id\s*\}\)/);
assert.match(app, /StudioMultitrackWorkspace\.scheduleProjectAutosave\(\)/);
assert.match(app, /data-global-transport="record"/);
assert.match(app, /createTrack\("midi",\s*"Piano Performance"\)/);
assert.match(app, /midiTrack\.midiNotes\.push\(note\)/);
assert.match(app, /lengthBars:\s*0\.125/);
assert.match(midiEditor, /for \(let pitch = 72; pitch >= 48; pitch -= 1\)/);

console.log("Studio Vocal Booth, Voice Notes, and piano MIDI integration checks passed.");
