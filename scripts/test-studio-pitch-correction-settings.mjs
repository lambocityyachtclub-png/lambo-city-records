import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [editScreen, multitrack, beatLab, pitchFactory] = await Promise.all([
  readFile(new URL("../studioDAWEditScreen.js", import.meta.url), "utf8"),
  readFile(new URL("../studioMultitrackWorkspace.js", import.meta.url), "utf8"),
  readFile(new URL("../floor2StudioApp.js", import.meta.url), "utf8"),
  readFile(new URL("../studioPitchCorrection.js", import.meta.url), "utf8")
]);

for (const setting of ["enabled", "root", "scale", "amount", "speedMs"]) {
  assert.ok(
    editScreen.includes('data-pitch-setting="' + setting + '"'),
    "EDIT should expose the " + setting + " pitch setting."
  );
}
assert.match(editScreen, /normalizePitchCorrectionSettings/);
assert.match(editScreen, /VOCAL PITCH CORRECTION/);
assert.match(editScreen, /Monophonic lead-vocal correction/);
assert.match(editScreen, /workspace\.recordHistory\("Vocal pitch correction "/);
assert.match(editScreen, /workspace\.scheduleProjectAutosave\(\)/);
assert.match(editScreen, /StudioMultitrackWorkspace\.activePitchTrackId/);

assert.match(multitrack, /activePitchTrackId: null/);
assert.match(multitrack, /pitchCorrection: \{ enabled: false, root: 0, scale: "major", amount: 100, speedMs: 25 \}/);
assert.match(multitrack, /selectedVocalTrack/);
assert.match(multitrack, /track\.id === this\.activePitchTrackId/);
assert.match(multitrack, /effects: \{ \.\.\.\(track\.effects \|\| \{\}\), pitchCorrection: \{ \.\.\.\(track\.effects\?\.pitchCorrection \|\| \{\}\) \} \}/);

assert.match(beatLab, /normalizePitchCorrectionSettings/);
assert.match(beatLab, /activeVocalTrack\?\.effects\?\.pitchCorrection/);
assert.match(beatLab, /createStudioPitchCorrectionNode\(this\.audio, pitchSettings\)/);
assert.match(pitchFactory, /Number\.isFinite\(amountValue\)/);
assert.match(pitchFactory, /Number\.isFinite\(speedValue\)/);

console.log("EDIT pitch controls, saved vocal-track settings, and Beat Lab shared-settings wiring tests passed.");
