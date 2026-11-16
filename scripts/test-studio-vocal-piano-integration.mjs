import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [app, workspace, navigation, midiEditor, vocalBooth, citySynth, multitrack] = await Promise.all([
  readFile(new URL("../studioDAWApp.js", import.meta.url), "utf8"),
  readFile(new URL("../studioDAWWorkspace.js", import.meta.url), "utf8"),
  readFile(new URL("../floor2StudioNavigation.js", import.meta.url), "utf8"),
  readFile(new URL("../studioDAWMidiEditor.js", import.meta.url), "utf8"),
  readFile(new URL("../floor2VocalBooth3D.js", import.meta.url), "utf8"),
  readFile(new URL("../floor2CitySynth.js", import.meta.url), "utf8"),
  readFile(new URL("../studioMultitrackWorkspace.js", import.meta.url), "utf8")
]);

assert.match(workspace, /id:\s*"vocals",\s*label:\s*"VOCAL BOOTH"/);
assert.match(navigation, /floor2SongEditorDisplay/);
assert.match(navigation, /view:\s*"edit"/);
assert.match(app, /this\.vocalsPanel\s*=\s*createVocalBoothPanel/);
assert.match(app, /setPanel\("vocals",\s*this\.vocalsPanel\)/);
assert.match(vocalBooth, /data-booth-mode-switch="vocal"/);
assert.match(vocalBooth, /data-booth-mode-switch="notes"/);
assert.match(vocalBooth, /data-booth-mode="notes" hidden/);
assert.match(vocalBooth, /Use the shared Studio RECORD control/);
assert.match(vocalBooth, /StudioTalkback\.bindControl/);
assert.match(app, /onTransportRecord: mode => this\.armSessionRecording\(mode\)/);
assert.match(app, /mode === "notes"/);
assert.match(app, /targetName = .*"Voice Notes"/);
assert.match(app, /workspace\.startArmedRecording\(/);
assert.match(app, /data-global-transport="record"/);
assert.match(citySynth, /onTransportRecord\?\.\("midi"\)/);
assert.match(citySynth, /track\.midiNotes\.push\(record\.midi\)/);
assert.match(app, /createTrack\("midi",\s*"City Synth Performance"\)/);
assert.match(app, /sessionMidiRecordingActive/);
assert.match(multitrack, /midiNotes/);
assert.match(app, /lengthBars:\s*0\.125/);
assert.match(midiEditor, /for \(let pitch = 72; pitch >= 48; pitch -= 1\)/);

console.log("Studio Vocal Booth, Voice Notes, and piano MIDI integration checks passed.");
