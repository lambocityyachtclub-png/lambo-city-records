import assert from "node:assert/strict";
import { createStudioMidiBlob, parseStudioMidi } from "../studioMidiFile.js";
const blob = createStudioMidiBlob({ tracks: [{ name: "Test", midiNotes: [{ pitch: 60, startBar: 1, lengthBars: 1, velocity: 0.8 }] }], tempo: 100 });
const parsed = parseStudioMidi(await blob.arrayBuffer());
assert.equal(parsed.tracks[0].notes.length, 1);
console.log("MIDI test passed.");
