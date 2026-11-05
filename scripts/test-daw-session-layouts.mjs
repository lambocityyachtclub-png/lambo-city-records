import assert from "node:assert/strict";
import {
  listStudioDAWSessionLayouts,
  applyStudioDAWSessionLayout
} from "../studioDAWSessionLayouts.js";

function createWorkspace({ recording = false } = {}) {
  return {
    tracks: [],
    nextTrackId: 1,
    tempo: 100,
    timeSignature: "6/8",
    tempoChanges: [{ bar: 5, bpm: 120 }],
    timeSignatureChanges: [{ bar: 5, numerator: 3, denominator: 4 }],
    markers: [{ id: "marker-old", name: "Old", bar: 5 }],
    loopRange: { enabled: true, startBar: 5, endBar: 9 },
    pendingRecording: false,
    history: [],
    statusMessage: "",
    createTrack(type, name) {
      const track = {
        id: "lc-track-" + this.nextTrackId++,
        type,
        name,
        volume: 80,
        pan: 0,
        inputSource: "mic",
        clips: [],
        midiNotes: [],
        automation: { volume: [] }
      };
      this.tracks.push(track);
      return track;
    },
    stopAll() { this.stopped = true; },
    recordHistory(label) { this.history.push(label); },
    isTrackRecording() { return recording; },
    render() { this.rendered = true; },
    scheduleProjectAutosave() { this.autosaveScheduled = true; },
    status(message) { this.statusMessage = message; }
  };
}

const layouts = listStudioDAWSessionLayouts();
assert.equal(layouts.length, 4);
assert.ok(layouts.some(layout => layout.id === "hip-hop-production"));
assert.ok(layouts.some(layout => layout.id === "full-band-tracking"));

const hipHop = createWorkspace();
const result = applyStudioDAWSessionLayout(hipHop, "hip-hop-production");
assert.equal(result.trackCount, 9);
assert.equal(hipHop.tempo, 100);
assert.equal(hipHop.timeSignature, "4/4");
assert.deepEqual(hipHop.tempoChanges, []);
assert.deepEqual(hipHop.timeSignatureChanges, []);
assert.deepEqual(hipHop.markers, []);
assert.equal(hipHop.loopRange.enabled, false);
assert.equal(hipHop.tracks.find(track => track.name === "KICK").inputSource, "mpc");
assert.equal(hipHop.tracks.find(track => track.name === "808 / BASS").type, "instrument");
assert.equal(hipHop.tracks.find(track => track.name === "KICK").groupName, "DRUMS");
assert.equal(hipHop.history[0], "Apply session layout");
assert.ok(hipHop.autosaveScheduled && hipHop.rendered);

const band = createWorkspace();
const bandResult = applyStudioDAWSessionLayout(band, "full-band-tracking");
assert.equal(bandResult.trackCount, 16);
assert.equal(band.tracks.find(track => track.name === "OVERHEAD LEFT").pan, -0.65);
assert.equal(band.tracks.find(track => track.name === "OVERHEAD RIGHT").pan, 0.65);

const active = createWorkspace({ recording: true });
assert.throws(() => applyStudioDAWSessionLayout(active, "singer-songwriter"), /Stop the active or scheduled recording/);
assert.equal(active.tracks.length, 0);
assert.throws(() => applyStudioDAWSessionLayout(createWorkspace(), "missing-layout"), /layout was not found/);

console.log("Studio multi-genre session layout tests passed.");
