
/*
 * LAMBO CITY RECORDS
 * PROFESSIONAL MULTITRACK WORKSPACE V1
 *
 * Dynamic track architecture.
 * No fixed four-track limit.
 * Separate from the existing Beat Lab.
 *
 * Audio recording and MIDI processing
 * will be connected in the next milestone.
 */
import {
  renderStudioDAWTimeline
} from "./studioDAWTimeline.js";

import StudioAudioEngine from "./studioAudioEngine.js";
import StudioRecordingEngine from "./studioRecordingEngine.js";
import StudioAudioExport from "./studioAudioExport.js";
import StudioMPCSampler from "./studioMPCSampler.js";
import StudioDAWSessionStore from "./studioDAWSessionStore.js";
import { createStudioPitchCorrectionNode } from "./studioPitchCorrection.js";

import {
  createStudioDAWArrangementPlayback
} from "./studioDAWArrangementPlayback.js";
const MAX_PORTABLE_SESSION_BYTES = 30000000;

async function encodeAudioBlob(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function decodeAudioBlob(data, mimeType = "audio/webm") {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType || "application/octet-stream" });
}

const TRACK_TYPES = [
  "audio",
  "midi",
  "instrument"
];

const StudioMultitrackWorkspace = {

  tracks: [],
  nextTrackId: 1,
  root: null,
  tempo: 100,
  sessionTemplateId: null,
  sessionTemplateName: null,
  arrangementPlayback: null,
  selectedClipId: null,
  selectedTrackId: null,
  zoomBarWidth: 72,
  playheadBar: 1,
  undoStack: [],
  redoStack: [],
  deletedItems: [],
  activeProjectId: null,
  activeProjectName: "Untitled Song",
  autosaveTimer: null,

  captureSnapshot() {
    return {
      tracks: this.tracks.map(track => ({
        ...track,
        eq: { ...(track.eq || {}) },
        compression: { ...(track.compression || {}) },
        effects: { ...(track.effects || {}), pitchCorrection: { ...(track.effects?.pitchCorrection || {}) } },
        automation: { volume: (track.automation?.volume || []).map(point => ({ ...point })) },
        clips: (track.clips || []).map(clip => ({ ...clip }))
      })),
      nextTrackId: this.nextTrackId,
      tempo: this.tempo
    };
  },

  recordHistory(label = "Edit") {
    this.undoStack.push({ label, snapshot: this.captureSnapshot() });
    if (this.undoStack.length > 80) this.undoStack.shift();
    this.redoStack = [];
    if (this.activeProjectId) {
      clearTimeout(this.autosaveTimer);
      this.autosaveTimer = setTimeout(() => {
        this.saveSession(this.activeProjectId, this.activeProjectName)
          .then(() => this.status("Auto-saved " + this.activeProjectName + "."))
          .catch(error => this.status("AUTO-SAVE ERROR: " + (error?.message || error)));
      }, 900);
    }
  },

  restoreSnapshot(snapshot) {
    this.stopAll();
    this.tracks = snapshot.tracks.map(track => ({
      ...track,
      eq: { ...(track.eq || {}) },
      compression: { ...(track.compression || {}) },
      effects: { ...(track.effects || {}), pitchCorrection: { ...(track.effects?.pitchCorrection || {}) } },
      automation: { volume: (track.automation?.volume || []).map(point => ({ ...point })) },
      clips: (track.clips || []).map(clip => ({ ...clip }))
    }));
    this.nextTrackId = snapshot.nextTrackId;
    this.tempo = snapshot.tempo;
    this.render();
  },

  undo() {
    const entry = this.undoStack.pop();
    if (!entry) return false;
    this.redoStack.push({ label: entry.label, snapshot: this.captureSnapshot() });
    this.restoreSnapshot(entry.snapshot);
    this.status("Undo · " + entry.label);
    return true;
  },

  redo() {
    const entry = this.redoStack.pop();
    if (!entry) return false;
    this.undoStack.push({ label: entry.label, snapshot: this.captureSnapshot() });
    this.restoreSnapshot(entry.snapshot);
    this.status("Redo · " + entry.label);
    return true;
  },

  setZoom(value) {
    this.zoomBarWidth = Math.max(24, Math.min(288, Number(value) || 72));
    this.render();
    this.status("Timeline zoom · " + Math.round(this.zoomBarWidth / 72 * 100) + "%.");
  },

  fitTimeline() {
    const ends = this.tracks.flatMap(track => (track.clips || []).map(clip => clip.startBar + clip.lengthBars - 1));
    const bars = Math.max(8, Math.min(128, Math.ceil(Math.max(8, ...ends))));
    const width = this.root?.querySelector("[data-track-list]")?.clientWidth || 720;
    this.zoomBarWidth = Math.max(24, Math.min(288, Math.floor((width - 24) / bars)));
    this.render();
    this.status("Fit arrangement · " + bars + " bars.");
  },

  selectClip(trackId, clip) {
    this.selectedTrackId = trackId;
    this.selectedClipId = clip?.id || null;
    this.root?.querySelectorAll(".lc-arrangement-clip").forEach(node => {
      node.classList.toggle("selected", node.dataset.clipId === this.selectedClipId);
    });
  },

  deleteSelectedClip() {
    const track = this.tracks.find(item => item.id === this.selectedTrackId);
    const index = track?.clips?.findIndex(clip => clip.id === this.selectedClipId) ?? -1;
    if (!track || index < 0) return false;
    this.recordHistory("Delete audio region");
    const [clip] = track.clips.splice(index, 1);
    this.deletedItems.push({ type: "clip", trackId: track.id, item: clip });
    this.selectedClipId = null;
    this.render();
    this.status("Region moved to session trash. Undo or restore it if needed.");
    return true;
  },

  splitSelectedClip() {
    const track = this.tracks.find(item => item.id === this.selectedTrackId);
    const clip = track?.clips?.find(item => item.id === this.selectedClipId);
    const splitBar = Number(this.playheadBar);
    if (!track || !clip || splitBar <= clip.startBar || splitBar >= clip.startBar + clip.lengthBars) {
      this.status("Place the edit cursor inside the selected region to split it.");
      return false;
    }
    this.recordHistory("Split audio region");
    const leftBars = splitBar - clip.startBar;
    const ratio = leftBars / clip.lengthBars;
    const totalDuration = Number(clip.playDurationSeconds || clip.duration || 0);
    const leftDuration = totalDuration > 0 ? totalDuration * ratio : 0;
    const right = {
      ...clip,
      id: "lc-clip-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
      name: (clip.name || "Audio Clip") + " · B",
      startBar: splitBar,
      lengthBars: clip.lengthBars - leftBars,
      sourceOffsetSeconds: (Number(clip.sourceOffsetSeconds) || 0) + leftDuration,
      playDurationSeconds: totalDuration > 0 ? totalDuration - leftDuration : undefined
    };
    clip.name = (clip.name || "Audio Clip") + " · A";
    clip.lengthBars = leftBars;
    if (totalDuration > 0) clip.playDurationSeconds = leftDuration;
    track.clips.splice(track.clips.indexOf(clip) + 1, 0, right);
    this.selectedClipId = right.id;
    this.render();
    this.status("Audio region split at bar " + splitBar + ".");
    return true;
  },

  restoreLastDeleted() {
    const deleted = this.deletedItems.pop();
    if (!deleted) return false;
    this.recordHistory("Restore deleted item");
    if (deleted.type === "clip") {
      const track = this.tracks.find(item => item.id === deleted.trackId);
      if (track) track.clips.push(deleted.item);
      else this.deletedItems.push(deleted);
    } else if (deleted.type === "track") {
      this.tracks.splice(Math.min(deleted.index, this.tracks.length), 0, deleted.item);
    }
    this.render();
    this.status("Restored deleted " + deleted.type + ".");
    return true;
  },

  scheduleProjectAutosave() {
    if (!this.activeProjectId) return;
    clearTimeout(this.autosaveTimer);
    this.autosaveTimer = setTimeout(() => {
      this.saveSession(this.activeProjectId, this.activeProjectName)
        .then(() => this.status("Auto-saved " + this.activeProjectName + "."))
        .catch(error => this.status("AUTO-SAVE ERROR: " + (error?.message || error)));
    }, 900);
  },

  setTempo(value) {
    const bpm = Number(value);

    if (!Number.isFinite(bpm)) return;

    this.tempo = Math.max(60, Math.min(180, bpm));
  },

  getArrangementPlayback() {
    if (!this.arrangementPlayback) {
      this.arrangementPlayback =
        createStudioDAWArrangementPlayback({
          getAudioContext: () =>
            StudioAudioEngine.resume(),

          getOutput: context =>
            StudioAudioEngine.master ||
            context.destination,

          getTempo: () => this.tempo,

          onStatus: message =>
            this.status(message)
        });
    }

    return this.arrangementPlayback;
  },

  createTrack(type = "audio", name = "") {
    
    if (!TRACK_TYPES.includes(type)) {
      throw new Error("Unsupported track type.");
    }

    const id = `lc-track-${this.nextTrackId++}`;

    const track = {
      id,
      name: name.trim() || `Track ${this.nextTrackId - 1}`,
      type,
      volume: 80,
      pan: 0,
      inputSource: "mic",
      eq: { low: 0, mid: 0, high: 0 },
      compression: { threshold: -18, ratio: 1 },
      effects: { delayTime: 0.28, delayFeedback: 0.25, delayMix: 0, reverbMix: 0, reverbDecay: 2.2, pitchCorrection: { enabled: false, root: 0, scale: "major", amount: 100, speedMs: 25 } },
      automation: { volume: [] },
      muted: false,
      solo: false,
      armed: false,
      clips: []
    };

    this.tracks.push(track);

    return track;
  },

  addTrack(type = "audio", name = "") {
    const track = this.createTrack(type, name);
    this.render();
    this.status(`${track.name} created.`);
    return track;
  },

  async listSavedSessions() {
    return StudioDAWSessionStore.list();
  },

  async saveSession(projectId, projectName = this.activeProjectName) {
    if (this.isTrackRecording()) {
      throw new Error("Stop the active track recording before saving the song session.");
    }
    const session = {
      format: "lambo-city-daw-session",
      version: 1,
      projectName: String(projectName || "Untitled Song").trim() || "Untitled Song",
      updatedAt: new Date().toISOString(),
      tempo: this.tempo,
      templateId: this.sessionTemplateId,
      templateName: this.sessionTemplateName,
      deletedItems: this.deletedItems,
      tracks: this.tracks.map(track => ({
        ...track,
        clips: (track.clips || []).filter(clip => clip.blob instanceof Blob && clip.blob.size > 0).map(clip => ({
          ...clip,
          objectUrl: undefined
        }))
      }))
    };
    await StudioDAWSessionStore.save(projectId, session);
    this.activeProjectId = projectId;
    this.activeProjectName = session.projectName;
    return true;
  },

  async loadSession(projectId) {
    if (this.isTrackRecording()) {
      throw new Error("Stop the active track recording before loading another song session.");
    }
    const session = await StudioDAWSessionStore.load(projectId);
    if (!session || session.format !== "lambo-city-daw-session" || session.version !== 1 || !Array.isArray(session.tracks)) {
      return false;
    }
    this.stopAll();
    this.tempo = Math.max(60, Math.min(180, Number(session.tempo) || 100));
    this.sessionTemplateId = session.templateId || null;
    this.sessionTemplateName = session.templateName || null;
    this.activeProjectId = session.projectId || projectId;
    this.activeProjectName = session.projectName || "Untitled Song";
    this.deletedItems = Array.isArray(session.deletedItems) ? session.deletedItems : [];
    this.tracks = session.tracks.map(track => ({
      ...track,
      clips: (track.clips || []).map(clip => ({ ...clip }))
    }));
    const ids = this.tracks.map(track => Number(track.id.match(/(\d+)$/)?.[1]) || 0);
    this.nextTrackId = Math.max(0, ...ids) + 1;
    this.undoStack = [];
    this.redoStack = [];
    this.selectedClipId = null;
    this.render();
    this.status("Saved song session restored with " + this.tracks.length + " track(s).");
    return true;
  },

  async removeSavedSession(projectId) {
    return StudioDAWSessionStore.remove(projectId);
  },

  resetSession({ tempo = 100 } = {}) {
    if (this.isTrackRecording()) {
      throw new Error("Stop the active track recording before starting a new song session.");
    }
    this.stopAll();
    this.tempo = Math.max(60, Math.min(180, Number(tempo) || 100));
    this.sessionTemplateId = null;
    this.sessionTemplateName = null;
    this.tracks = [];
    this.deletedItems = [];
    this.selectedClipId = null;
    this.selectedTrackId = null;
    this.nextTrackId = 1;
    this.createTrack("audio", "Vocals");
    this.createTrack("audio", "Drums");
    this.createTrack("instrument", "Instruments");
    this.createTrack("audio", "Beats");
    this.render();
    this.status("New song session ready.");
  },

  async exportSession() {
    if (this.isTrackRecording()) {
      throw new Error("Stop the active track recording before exporting the song project.");
    }
    let encodedBytes = 0;
    const tracks = [];
    for (const track of this.tracks) {
      const clips = [];
      for (const clip of (track.clips || [])) {
        if (!(clip.blob instanceof Blob) || !clip.blob.size) continue;
        encodedBytes += clip.blob.size;
        if (encodedBytes > MAX_PORTABLE_SESSION_BYTES) {
          throw new Error("Session audio exceeds the 30 MB portable audio limit. Export fewer or shorter audio clips.");
        }
        clips.push({
          id: clip.id,
          name: clip.name || "Audio Clip",
          startBar: Number(clip.startBar) || 1,
          lengthBars: Number(clip.lengthBars) || 4,
          duration: Number(clip.duration) || 0,
          sourceOffsetSeconds: Number(clip.sourceOffsetSeconds) || 0,
          playDurationSeconds: Number(clip.playDurationSeconds) || 0,
          mimeType: clip.blob.type || "application/octet-stream",
          data: await encodeAudioBlob(clip.blob),
          takeId: clip.takeId || null,
          createdAt: clip.createdAt || null
        });
      }
      tracks.push({
        id: track.id,
        name: track.name,
        type: TRACK_TYPES.includes(track.type) ? track.type : "audio",
        volume: Math.max(0, Math.min(100, Number(track.volume) || 0)),
        pan: Math.max(-1, Math.min(1, Number(track.pan) || 0)),
        inputSource: ["mic", "beatlab", "mpc"].includes(track.inputSource) ? track.inputSource : "mic",
        eq: {
          low: Number(track.eq?.low) || 0,
          mid: Number(track.eq?.mid) || 0,
          high: Number(track.eq?.high) || 0
        },
        compression: {
          threshold: Number(track.compression?.threshold ?? -18),
          ratio: Math.max(1, Math.min(8, Number(track.compression?.ratio) || 1))
        },
        effects: {
          delayTime: Number(track.effects?.delayTime ?? 0.28),
          delayFeedback: Number(track.effects?.delayFeedback ?? 0.25),
          delayMix: Number(track.effects?.delayMix ?? 0),
          reverbMix: Number(track.effects?.reverbMix ?? 0),
          reverbDecay: Number(track.effects?.reverbDecay ?? 2.2),
          pitchCorrection: {
            enabled: Boolean(track.effects?.pitchCorrection?.enabled),
            root: Math.max(0, Math.min(11, Math.round(Number(track.effects?.pitchCorrection?.root) || 0))),
            scale: ["major", "minor", "chromatic"].includes(track.effects?.pitchCorrection?.scale) ? track.effects.pitchCorrection.scale : "major",
            amount: Math.max(0, Math.min(100, Number(track.effects?.pitchCorrection?.amount ?? 100))),
            speedMs: Math.max(0, Math.min(120, Number(track.effects?.pitchCorrection?.speedMs ?? 25)))
          }
        },
        automation: {
          volume: Array.isArray(track.automation?.volume) ? track.automation.volume.map(point => ({
            bar: Number(point.bar),
            value: Number(point.value)
          })) : []
        },
        muted: Boolean(track.muted),
        solo: Boolean(track.solo),
        armed: Boolean(track.armed),
        clips
      });
    }
    return {
      format: "lambo-city-daw-session",
      version: 1,
      tempo: this.tempo,
      templateId: this.sessionTemplateId,
      templateName: this.sessionTemplateName,
      projectName: this.activeProjectName || "Untitled Song",
      tracks
    };
  },

  importSession(session) {
    if (this.isTrackRecording()) {
      throw new Error("Stop the active track recording before importing another song session.");
    }
    if (!session || session.format !== "lambo-city-daw-session" ||
        session.version !== 1 || !Array.isArray(session.tracks)) {
      throw new Error("The portable DAW session is invalid.");
    }
    this.stopAll();
    this.tempo = Math.max(60, Math.min(180, Number(session.tempo) || 100));
    this.sessionTemplateId = session.templateId || null;
    this.sessionTemplateName = session.templateName || null;
    this.tracks = session.tracks.map((savedTrack, index) => ({
      id: savedTrack.id || `lc-track-import-${index + 1}`,
      name: String(savedTrack.name || `Track ${index + 1}`),
      type: TRACK_TYPES.includes(savedTrack.type) ? savedTrack.type : "audio",
      volume: Math.max(0, Math.min(100, Number(savedTrack.volume) || 0)),
      pan: Math.max(-1, Math.min(1, Number(savedTrack.pan) || 0)),
      inputSource: ["mic", "beatlab", "mpc"].includes(savedTrack.inputSource) ? savedTrack.inputSource : "mic",
      eq: {
        low: Number(savedTrack.eq?.low) || 0,
        mid: Number(savedTrack.eq?.mid) || 0,
        high: Number(savedTrack.eq?.high) || 0
      },
      compression: {
        threshold: Number(savedTrack.compression?.threshold ?? -18),
        ratio: Math.max(1, Math.min(8, Number(savedTrack.compression?.ratio) || 1))
      },
      effects: {
        delayTime: Number(savedTrack.effects?.delayTime ?? 0.28),
        delayFeedback: Number(savedTrack.effects?.delayFeedback ?? 0.25),
        delayMix: Number(savedTrack.effects?.delayMix ?? 0),
        reverbMix: Number(savedTrack.effects?.reverbMix ?? 0),
        reverbDecay: Number(savedTrack.effects?.reverbDecay ?? 2.2),
        pitchCorrection: {
          enabled: Boolean(savedTrack.effects?.pitchCorrection?.enabled),
          root: Math.max(0, Math.min(11, Math.round(Number(savedTrack.effects?.pitchCorrection?.root) || 0))),
          scale: ["major", "minor", "chromatic"].includes(savedTrack.effects?.pitchCorrection?.scale) ? savedTrack.effects.pitchCorrection.scale : "major",
          amount: Math.max(0, Math.min(100, Number(savedTrack.effects?.pitchCorrection?.amount ?? 100))),
          speedMs: Math.max(0, Math.min(120, Number(savedTrack.effects?.pitchCorrection?.speedMs ?? 25)))
        }
      },
      automation: {
        volume: Array.isArray(savedTrack.automation?.volume) ? savedTrack.automation.volume.map(point => ({
          bar: Number(point.bar),
          value: Number(point.value)
        })) : []
      },
      muted: Boolean(savedTrack.muted),
      solo: Boolean(savedTrack.solo),
      armed: Boolean(savedTrack.armed),
      clips: (savedTrack.clips || []).map(clip => ({
        id: clip.id,
        name: clip.name || "Audio Clip",
        startBar: Math.max(1, Number(clip.startBar) || 1),
        lengthBars: Math.max(1, Number(clip.lengthBars) || 4),
        duration: Number(clip.duration) || 0,
        sourceOffsetSeconds: Number(clip.sourceOffsetSeconds) || 0,
        playDurationSeconds: Number(clip.playDurationSeconds) || 0,
        blob: decodeAudioBlob(clip.data, clip.mimeType),
        takeId: clip.takeId || null,
        createdAt: clip.createdAt || null
      }))
    }));
    const ids = this.tracks.map(track => Number(track.id.match(/(\d+)$/)?.[1]) || 0);
    this.nextTrackId = Math.max(0, ...ids) + 1;
    this.render();
    this.status("Portable session loaded with " + this.tracks.length + " track(s).");
    return true;
  },



  removeTrack(id) {
    const index = this.tracks.findIndex(
      track => track.id === id
    );

    if (index === -1) return;

    const track = this.tracks[index];
    this.recordHistory("Delete track");
    this.tracks.splice(index, 1);
    this.deletedItems.push({ type: "track", index, item: track });

    this.render();
    this.status(track.name + " moved to session trash.");
  },

  renameTrack(id, name) {
    const track = this.tracks.find(
      item => item.id === id
    );

    if (!track || !name.trim()) return;

    this.recordHistory("Rename track");
    track.name = name.trim();
    this.render();
    this.status("Track renamed.");
  },

  mount(parent) {
    if (!parent) {
      throw new Error(
        "Multitrack workspace container unavailable."
      );
    }

    if (parent.querySelector("#lc-multitrack-workspace")) {
      return this.root;
    }

    // Prevent duplicate tracks if the workspace is reopened.
    if (this.tracks.length === 0) {
      this.createTrack("audio", "Vocals");
      this.createTrack("audio", "Drums");
      this.createTrack("instrument", "Instruments");
      this.createTrack("audio", "Beats");
    }

    const root = document.createElement("section");

    root.id = "lc-multitrack-workspace";

    root.innerHTML = `
      <style>
        #lc-multitrack-workspace {
          margin: 0;
          padding: 16px;
          background: linear-gradient(145deg,#11151d,#0b0e14);
          color: #f5f4f0;
          border: 1px solid #343946;
          border-radius: 12px;
          font-family: Arial, sans-serif;
        }

        #lc-multitrack-workspace * {
          box-sizing: border-box;
        }

        #lc-multitrack-workspace h2 {
          margin: 8px 0;
          font-size: 24px;
        }

        #lc-multitrack-workspace .lc-eyebrow {
          color: #e6bb69;
          font-size: 11px;
          letter-spacing: 2px;
        }

        #lc-multitrack-workspace .lc-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 20px 0;
        }

        #lc-multitrack-workspace button,
        #lc-multitrack-workspace input,
        #lc-multitrack-workspace select {
          font: inherit;
        }

        #lc-multitrack-workspace button {
          min-height: 40px;
          padding: 9px 13px;
          background: #222631;
          color: white;
          border: 1px solid #665438;
          border-radius: 8px;
          cursor: pointer;
          touch-action: manipulation;
        }

        #lc-multitrack-workspace button.active {
          background: #594321;
          border-color: #e6bb69;
        }

        #lc-multitrack-workspace .lc-add-form {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 20px;
        }

        #lc-multitrack-workspace input,
        #lc-multitrack-workspace select {
          width: 100%;
          min-width: 0;
          min-height: 42px;
          padding: 9px;
          color: white;
          background: #20242e;
          border: 1px solid #454958;
          border-radius: 7px;
        }

        #lc-multitrack-workspace .lc-track {
          margin: 10px 0;
          padding: 11px;
          background: #151a23;
          border: 1px solid #343946;
          border-radius: 9px;
        }

        #lc-multitrack-workspace .lc-track-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 12px;
        }

        #lc-multitrack-workspace .lc-track-name {
          font-size: 13px;
          font-weight: bold;
          color: #e6bb69;
        }

        #lc-multitrack-workspace .lc-track-type {
          color: #999fad;
          font-size: 10px;
          text-transform: uppercase;
        }

        #lc-multitrack-workspace .lc-track-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        #lc-multitrack-workspace .lc-track-controls button {
          min-height: 34px;
          padding: 6px 9px;
          font-size: 10px;
        }

        #lc-multitrack-workspace .lc-volume {
          display: grid;
          grid-template-columns: 65px minmax(0, 1fr) 35px;
          align-items: center;
          gap: 8px;
          margin: 12px 0;
          color: #a8a8b1;
          font-size: 11px;
        }

        #lc-multitrack-workspace .lc-volume input {
          accent-color: #e6bb69;
          padding: 0;
          min-height: 20px;
        }

       #lc-multitrack-workspace .lc-timeline {
  display: block;
  min-height: 110px;
  overflow: visible;
  padding: 0;
  background: transparent;
  border: 0;
}

        #lc-multitrack-workspace .lc-clip {
          flex: 0 0 120px;
          min-height: 55px;
          padding: 10px;
          background: #b99a62;
          color: #111;
          border-radius: 5px;
          font-size: 11px;
          font-weight: bold;
        }

        #lc-multitrack-workspace .lc-empty {
          align-self: center;
          color: #777f90;
          font-size: 11px;
        }

        #lc-multitrack-workspace .lc-status {
          margin-top: 18px;
          min-height: 22px;
          color: #e6bb69;
          font-size: 12px;
        }

        @media(max-width:600px) {
          #lc-multitrack-workspace .lc-add-form {
            grid-template-columns: 1fr;
          }
        }
      </style>

      <div class="lc-eyebrow">
        LAMBO CITY RECORDS · SONG EDITOR SESSION
      </div>

      <h2>SESSION TRACKS</h2>

      <p style="color:#a8a8b1;font-size:13px">
        Your recorded vocals, beats, and mix stems arranged on one shared song timeline.
      </p>

      <div class="lc-add-form">
        <input
          type="text"
          data-new-name
          placeholder="Track name (optional)"
          aria-label="New track name"
        >

        <select data-new-type aria-label="Track type">
          <option value="audio">Audio Track</option>
          <option value="midi">MIDI Track</option>
          <option value="instrument">Instrument Track</option>
        </select>

        <button type="button" data-action="add-track">
          + ADD TRACK
        </button>
        <button type="button" data-action="import-audio">
          IMPORT AUDIO
        </button>
        <input type="file" data-audio-files accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.webm" multiple hidden>
      </div>

      <div class="lc-edit-toolbar" style="display:flex;flex-wrap:wrap;gap:7px;align-items:center;margin:0 0 14px">
        <button type="button" data-edit-action="undo">↶ UNDO</button>
        <button type="button" data-edit-action="redo">↷ REDO</button>
        <button type="button" data-edit-action="zoom-out">− ZOOM</button>
        <button type="button" data-edit-action="zoom-in">＋ ZOOM</button>
        <button type="button" data-edit-action="fit">FIT SONG</button>
        <button type="button" data-edit-action="split">SPLIT AT CURSOR</button>
        <button type="button" data-edit-action="delete-clip">DELETE REGION</button>
        <button type="button" data-edit-action="restore">RESTORE LAST DELETED</button>
      </div>
      <div data-track-list></div>

      <div class="lc-status" data-status role="status">
        Workspace ready.
      </div>
    `;

    parent.appendChild(root);
    this.root = root;

    root.addEventListener("click", event => {
      const button = event.target.closest("button");

      if (!button || !root.contains(button)) return;

      const editAction = button.dataset.editAction;
      if (editAction) {
        if (editAction === "undo") this.undo();
        if (editAction === "redo") this.redo();
        if (editAction === "zoom-in") this.setZoom(this.zoomBarWidth * 1.35);
        if (editAction === "zoom-out") this.setZoom(this.zoomBarWidth / 1.35);
        if (editAction === "fit") this.fitTimeline();
        if (editAction === "split") this.splitSelectedClip();
        if (editAction === "delete-clip") this.deleteSelectedClip();
        if (editAction === "restore") this.restoreLastDeleted();
        return;
      }

      const action = button.dataset.action;

      if (action === "add-track") {
        this.recordHistory("Add track");
        const name = root.querySelector("[data-new-name]").value;
        const type = root.querySelector("[data-new-type]").value;

        this.addTrack(type, name);

        root.querySelector("[data-new-name]").value = "";
        return;
      }

      if (action === "import-audio") {
        root.querySelector("[data-audio-files]").click();
        return;
      }

      if (action === "add-clip") {
        const firstTrack = this.tracks[0];

        if (firstTrack) {
          this.addClip(firstTrack.id);
        }

        return;
      }

      const trackRow = button.closest("[data-track-id]");
      if (!trackRow) return;

      const id = trackRow.dataset.trackId;
      const track = this.tracks.find(item => item.id === id);

      if (!track) return;

      const control = button.dataset.control;

      if (control === "delete") {
        if (window.confirm("Move track “" + track.name + "” and its regions to session trash?")) this.removeTrack(id);
      }

      if (control === "rename") {
        const name = window.prompt(
          "Enter the new track name:",
          track.name
        );

        if (name !== null) {
          this.renameTrack(id, name);
        }
      }

      if (control === "mute") {
        this.recordHistory("Toggle mute");
        track.muted = !track.muted;
        this.arrangementPlayback?.syncTrackState(this.tracks);
        this.render();
        this.status(`${track.name} mute ${track.muted ? "on" : "off"}.`);
      }

      if (control === "solo") {
        this.recordHistory("Toggle solo");
        track.solo = !track.solo;
        this.arrangementPlayback?.syncTrackState(this.tracks);
        this.render();
        this.status(`${track.name} solo ${track.solo ? "on" : "off"}.`);
      }

      if (control === "arm") {
        this.recordHistory("Toggle record arm");
        track.armed = !track.armed;
        this.render();
        this.status(`${track.name} record arm ${track.armed ? "on" : "off"}.`);
      }

    });

    root.querySelector("[data-audio-files]").addEventListener("change", event => {
      const files = Array.from(event.target.files || []);
      if (files.length) void this.importAudioFiles(files);
      event.target.value = "";
    });

    root.addEventListener("input", event => {
      if (!event.target.matches("[data-volume], [data-pan]")) return;

      const row = event.target.closest("[data-track-id]");
      const track = this.tracks.find(
        item => item.id === row?.dataset.trackId
      );

      if (!track) return;

      if (event.target.matches("[data-volume]")) {
        if (event.target.dataset.historyValue !== event.target.value) {
          if (event.type === "input" && !event.target.dataset.historyStarted) {
            this.recordHistory("Track volume");
            event.target.dataset.historyStarted = "1";
          }
          event.target.dataset.historyValue = event.target.value;
        }
        track.volume = Number(event.target.value);
        row.querySelector("[data-volume-label]").textContent = `${track.volume}%`;
        this.arrangementPlayback?.setTrackVolume(track.id, track.volume);
      } else {
        if (event.type === "input" && !event.target.dataset.historyStarted) {
          this.recordHistory("Track pan");
          event.target.dataset.historyStarted = "1";
        }
        track.pan = Number(event.target.value) / 100;
        const label = row.querySelector("[data-pan-label]");
        if (label) label.textContent = track.pan === 0
          ? "C"
          : (track.pan < 0 ? "L " : "R ") + Math.round(Math.abs(track.pan) * 100);
        this.arrangementPlayback?.setTrackPan(track.id, track.pan);
      }
    });

    this.render();

    return root;
  },

  async startArmedRecording({ vocalEffects } = {}) {
    const armedTracks = this.tracks.filter(track => track.armed && track.type === "audio");
    if (armedTracks.length !== 1) {
      this.status(armedTracks.length ? "Arm exactly one audio track to record." : "Arm the audio track you want to record into.");
      return false;
    }
    try {
      const audio = await StudioAudioEngine.resume();
      const track = armedTracks[0];
      const inputNode = track.inputSource === "beatlab"
        ? StudioAudioExport.getOutput(audio)
        : track.inputSource === "mpc"
          ? StudioMPCSampler.ensureOutput(audio)
          : null;
      const pitchCorrectionNode = track.inputSource === "mic" && /vocal/i.test(track.name) && track.effects?.pitchCorrection?.enabled
        ? await createStudioPitchCorrectionNode(audio, track.effects.pitchCorrection)
        : null;
      await StudioRecordingEngine.startTrackRecording({
        audio,
        trackId: track.id,
        inputNode,
        pitchCorrectionNode,
        vocalEffects: track.inputSource === "mic" && /vocal/i.test(track.name) ? vocalEffects : null
      });
      const sourceLabel = track.inputSource === "mpc"
        ? "MPC output"
        : track.inputSource === "beatlab"
          ? "Digital Beat Lab output"
          : "microphone";
      this.status("Recording " + sourceLabel + " into " + track.name + ".");
      return true;
    } catch (error) {
      this.status("RECORDING ERROR: " + (error?.message || error));
      return false;
    }
  },

  async stopArmedRecording() {
    if (!StudioRecordingEngine.activeTrackTake) return false;
    try {
      const take = await StudioRecordingEngine.stopTrackRecording();
      let track = this.tracks.find(item => item.id === take.trackId);
      if (!track) track = this.createTrack("audio", "Recovered Recording");
      const context = await StudioAudioEngine.resume();
      const bytes = await take.blob.arrayBuffer();
      const buffer = await context.decodeAudioData(bytes.slice(0));
      const lengthBars = Math.max(1, Math.min(128, Math.ceil(buffer.duration / (240 / this.tempo))));
      track.clips.push({
        id: take.id,
        name: track.name + " Recording",
        blob: take.blob,
        takeId: take.id,
        startBar: 1,
        lengthBars,
        duration: buffer.duration,
        createdAt: take.startedAt
      });
      this.render();
      this.status("Recording saved to " + track.name + " as a new waveform clip.");
      return true;
    } catch (error) {
      this.status("RECORDING SAVE ERROR: " + (error?.message || error));
      return false;
    }
  },

  isTrackRecording() {
    return Boolean(StudioRecordingEngine.activeTrackTake);
  },

  async importAudioFiles(files = []) {
    const audioFiles = files.filter(file => file instanceof Blob && file.size > 0);
    if (!audioFiles.length) return;

    try {
      const context = await StudioAudioEngine.resume();
      for (const file of audioFiles) {
        const bytes = await file.arrayBuffer();
        const buffer = await context.decodeAudioData(bytes.slice(0));
        const baseName = file.name.replace(/\.[^.]+$/, "") || "Imported Audio";
        const track = this.createTrack("audio", baseName);
        const bars = Math.max(1, Math.min(128, Math.ceil(buffer.duration / (240 / this.tempo))));
        track.clips.push({
          id: track.id + "-import-1",
          name: file.name,
          blob: file,
          takeId: null,
          startBar: 1,
          lengthBars: bars,
          duration: buffer.duration,
          createdAt: new Date().toISOString()
        });
      }
      this.render();
      this.status(audioFiles.length + " audio file(s) imported into separate session track(s).");
    } catch (error) {
      this.status("AUDIO IMPORT ERROR: " + (error?.message || error));
    }
  },

   addClip(id) {
    const track = this.tracks.find(item => item.id === id);

    if (!track) return;

    track.clips.push({
      id: `${id}-clip-${track.clips.length + 1}`,
      name: `${track.name} Clip ${track.clips.length + 1}`,
      blob: null,
      takeId: null
    });

    this.render();
    this.status(`${track.name} clip added.`);
  },


  addRecordingTake(take) {
    if (
      !take?.id ||
      !take.beat ||
      !take.vocal ||
      !take.mix
    ) {
      throw new Error("The completed recording take is incomplete.");
    }

    const recordings = [
      {
        trackName: "Vocals",
        clipName: "Vocal Recording",
        blob: take.vocal
      },
      {
        trackName: "Beats",
        clipName: "Beat Lab Recording",
        blob: take.beat
      },
      {
        trackName: "Master Mix",
        clipName: "Combined Master Recording",
        blob: take.mix
      }
    ];

    recordings.forEach(recording => {
      let track = this.tracks.find(
        item => item.name === recording.trackName
      );

      if (!track) {
        track = this.createTrack("audio", recording.trackName);
      }

      const clip = {
        id: `${take.id}-${recording.trackName.toLowerCase().replace(/\s+/g, "-")}`,
        name: recording.clipName,
        blob: recording.blob,
        takeId: take.id,
        createdAt: new Date().toISOString(),
        objectUrl: null
      };

      if (clip.blob.size > 0) {
        clip.objectUrl = URL.createObjectURL(clip.blob);
      }

      track.clips.push(clip);
    });

    this.render();

    this.status(
      "Vocal, Beat Lab, and Master Mix recordings added."
    );
  },
  
  isPlaying() {
    const players = Array.from(
      this.root?.querySelectorAll("[data-track-list] audio") || []
    );

    return Boolean(this.arrangementPlayback?.playing) ||
      players.some(
        player => !player.paused && !player.ended
      );
  },

  async playAll() {
    this.stopAll();

    if (!this.tracks.some(track =>
      track.clips?.some(clip =>
        clip.blob && clip.blob.size > 0
      )
    )) {
      this.status("No recorded audio clips available.");
      return;
    }

    await this.getArrangementPlayback().play(
      this.tracks
    );
  },

  stopAll() {
    if (this.arrangementPlayback) {
      this.arrangementPlayback.stop();
    }

    const players = this.root?.querySelectorAll(
      "[data-track-list] audio"
    ) || [];

    players.forEach(player => {
      player.pause();
      player.currentTime = 0;
    });

    this.status("Multitrack playback stopped.");
  },

  togglePlayback() {
    if (this.isPlaying()) {
      this.stopAll();
    } else {
      void this.playAll();
    }
  },
  render() {
    if (!this.root) return;

    const list = this.root.querySelector("[data-track-list]");

    if (!list) return;

    list.replaceChildren();

    this.tracks.forEach(track => {
      const row = document.createElement("div");

      row.className = "lc-track";
      row.dataset.trackId = track.id;

      const header = document.createElement("div");
      header.className = "lc-track-header";

      const identity = document.createElement("div");

      const name = document.createElement("div");
      name.className = "lc-track-name";
      name.textContent = track.name;

      const type = document.createElement("div");
      type.className = "lc-track-type";
      type.textContent = `${track.type} track`;

      identity.append(name, type);

      const controls = document.createElement("div");
      controls.className = "lc-track-controls";

      [
        ["mute", "MUTE", track.muted],
        ["solo", "SOLO", track.solo],
        ["arm", "REC ARM", track.armed],
        ["rename", "RENAME", false],
        ["delete", "DELETE", false]
      ].forEach(([control, label, active]) => {
        const button = document.createElement("button");

        button.type = "button";
        button.dataset.control = control;
        button.textContent = label;

        if (active) button.classList.add("active");

        controls.appendChild(button);
      });

      header.append(identity, controls);

      const volume = document.createElement("div");
      volume.className = "lc-volume";

      const volumeName = document.createElement("span");
      volumeName.textContent = "VOLUME";

      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = "0";
      slider.max = "100";
      slider.value = String(track.volume);
      slider.dataset.volume = "";

      const volumeLabel = document.createElement("span");
      volumeLabel.dataset.volumeLabel = "";
      volumeLabel.textContent = `${track.volume}%`;

      volume.append(volumeName, slider, volumeLabel);

      const pan = document.createElement("div");
      pan.className = "lc-volume";
      const panName = document.createElement("span");
      panName.textContent = "PAN";
      const panSlider = document.createElement("input");
      panSlider.type = "range";
      panSlider.min = "-100";
      panSlider.max = "100";
      panSlider.value = String(Math.round((track.pan || 0) * 100));
      panSlider.dataset.pan = "";
      const panLabel = document.createElement("span");
      panLabel.dataset.panLabel = "";
      panLabel.textContent = !track.pan ? "C" : (track.pan < 0 ? "L " : "R ") + Math.round(Math.abs(track.pan) * 100);
      pan.append(panName, panSlider, panLabel);

     const timeline = document.createElement("div");
timeline.className = "lc-timeline";

renderStudioDAWTimeline({
  container: timeline,
  track,

  onChange: clip => {
    this.status(
      `${clip.name} moved to bar ${clip.startBar}.`
    );
  }
});
      

      row.append(header, volume, pan, timeline);
      list.appendChild(row);
    });
  },

  status(message) {
    const element = this.root?.querySelector("[data-status]");

    if (element) element.textContent = message;
  }
};

export default StudioMultitrackWorkspace;
