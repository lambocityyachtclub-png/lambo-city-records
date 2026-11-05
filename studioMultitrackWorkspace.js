
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
import { scheduleStudioMetronome, stopStudioMetronome } from "./studioMetronome.js";
import { listStudioDAWSessionLayouts, applyStudioDAWSessionLayout } from "./studioDAWSessionLayouts.js";

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

function decodeSessionClipAudio(clip, audioAssets, cache) {
  const assetId = clip.audioAssetId;
  const asset = assetId && audioAssets && audioAssets[assetId];
  if (!asset) return decodeAudioBlob(clip.data, clip.mimeType);
  if (!cache.has(assetId)) cache.set(assetId, decodeAudioBlob(asset.data, asset.mimeType));
  return cache.get(assetId);
}

const TRACK_TYPES = [
  "audio",
  "midi",
  "instrument",
  "bus"
];

const StudioMultitrackWorkspace = {

  tracks: [],
  nextTrackId: 1,
  root: null,
  onRender: null,
  tempo: 100,
  timeSignature: "4/4",
  tempoChanges: [],
  timeSignatureChanges: [],
  markers: [],
  loopRange: { enabled: false, startBar: 1, endBar: 9 },
  followPlayhead: true,
  selectedRegionIds: [],
  multiSelectMode: false,
  sessionTemplateId: null,
  sessionTemplateName: null,
  arrangementPlayback: null,
  selectedClipId: null,
  selectedTrackId: null,
  zoomBarWidth: 72,
  playheadBar: 1,
  snapMode: "bars",
  slipMode: false,
  pendingRecording: false,
  recordingScheduleTimer: null,
  recordingScheduleResolve: null,
  punchOutTimer: null,
  recordingStartBar: 1,
  inputDeviceId: "",
  inputLatencyMs: 0,
  inputLatencyByDevice: {},
  undoStack: [],
  redoStack: [],
  deletedItems: [],
  activeProjectId: null,
  activeProjectName: "Untitled Song",
  autosaveTimer: null,
  dirty: false,
  saveState: "saved",
  savePromise: null,
  masterSettings: { volume: 100, stereoWidth: 100, compressionRatio: 3, limiterEnabled: true, limiterCeilingDb: -1 },
  metronomeSettings: { enabled: false, volume: 0.16, accent: true },
  recordingMetronomeSources: [],
  recordingMetronomeStartBar: 1,
  recordingMetronomeStartTime: 0,
  recordingMetronomeEndBar: 129,

  captureSnapshot() {
    return {
      tracks: this.tracks.map(track => ({
        ...track,
        eq: { ...(track.eq || {}) },
        compression: { ...(track.compression || {}) },
        effects: { ...(track.effects || {}), pitchCorrection: { ...(track.effects?.pitchCorrection || {}) } },
        automation: { volume: (track.automation?.volume || []).map(point => ({ ...point })) },
        clips: (track.clips || []).map(clip => ({ ...clip })),
        midiNotes: (track.midiNotes || []).map(note => ({ ...note })),
        sends: (track.sends || []).map(send => ({ ...send }))
      })),
      nextTrackId: this.nextTrackId,
      tempo: this.tempo,
      timeSignature: this.timeSignature,
      tempoChanges: this.tempoChanges.map(point => ({ ...point })),
      timeSignatureChanges: this.timeSignatureChanges.map(point => ({ ...point })),
      markers: this.markers.map(marker => ({ ...marker })),
      loopRange: { ...this.loopRange },
      masterSettings: { ...(this.masterSettings || {}) },
      metronomeSettings: { ...(this.metronomeSettings || {}) },
      deletedItems: this.deletedItems.map(entry => ({ ...entry }))
    };
  },

  recordHistory(label = "Edit") {
    this.undoStack.push({ label, snapshot: this.captureSnapshot() });
    if (this.undoStack.length > 80) this.undoStack.shift();
    this.redoStack = [];
    this.scheduleProjectAutosave();
  },

  restoreSnapshot(snapshot) {
    this.stopAll();
    this.tracks = snapshot.tracks.map(track => ({
      ...track,
      eq: { ...(track.eq || {}) },
      compression: { ...(track.compression || {}) },
      effects: { ...(track.effects || {}), pitchCorrection: { ...(track.effects?.pitchCorrection || {}) } },
      automation: { volume: (track.automation?.volume || []).map(point => ({ ...point })) },
      clips: (track.clips || []).map(clip => ({ ...clip })),
      midiNotes: (track.midiNotes || []).map(note => ({ ...note })),
      sends: (track.sends || []).map(send => ({ ...send }))
    }));
    this.nextTrackId = snapshot.nextTrackId;
    this.tempo = snapshot.tempo;
    this.timeSignature = snapshot.timeSignature || "4/4";
    this.tempoChanges = (snapshot.tempoChanges || []).map(point => ({ ...point }));
    this.timeSignatureChanges = (snapshot.timeSignatureChanges || []).map(point => ({ ...point }));
    this.markers = (snapshot.markers || []).map(marker => ({ ...marker }));
    this.loopRange = { ...(snapshot.loopRange || { enabled: false, startBar: 1, endBar: 9 }) };
    this.masterSettings = { volume: Math.max(0, Math.min(100, Number(snapshot.masterSettings?.volume ?? 100))), stereoWidth: Math.max(0, Math.min(200, Number(snapshot.masterSettings?.stereoWidth ?? 100))), compressionRatio: Math.max(1, Math.min(8, Number(snapshot.masterSettings?.compressionRatio ?? 3))), limiterEnabled: snapshot.masterSettings?.limiterEnabled !== false, limiterCeilingDb: Math.max(-6, Math.min(0, Number(snapshot.masterSettings?.limiterCeilingDb ?? -1))) };
    this.metronomeSettings = { enabled: Boolean(snapshot.metronomeSettings?.enabled), volume: Math.max(0, Math.min(0.4, Number(snapshot.metronomeSettings?.volume ?? 0.16))), accent: snapshot.metronomeSettings?.accent !== false };
    StudioAudioEngine.setMasterVolume(this.masterSettings.volume / 100);
    StudioAudioEngine.setStereoWidth(this.masterSettings.stereoWidth);
    StudioAudioEngine.setMasterCompressionRatio(this.masterSettings.compressionRatio);
    StudioAudioEngine.setMasterLimiter(this.masterSettings.limiterEnabled, this.masterSettings.limiterCeilingDb);
    this.deletedItems = (snapshot.deletedItems || []).map(entry => ({ ...entry }));
    this.render();
  },

  undo() {
    const entry = this.undoStack.pop();
    if (!entry) return false;
    this.redoStack.push({ label: entry.label, snapshot: this.captureSnapshot() });
    this.restoreSnapshot(entry.snapshot);
    this.scheduleProjectAutosave();
    this.status("Undo · " + entry.label);
    return true;
  },

  redo() {
    const entry = this.redoStack.pop();
    if (!entry) return false;
    this.undoStack.push({ label: entry.label, snapshot: this.captureSnapshot() });
    this.restoreSnapshot(entry.snapshot);
    this.scheduleProjectAutosave();
    this.status("Redo · " + entry.label);
    return true;
  },

  setZoom(value) {
    this.zoomBarWidth = Math.max(24, Math.min(288, Number(value) || 72));
    this.render();
    this.scheduleProjectAutosave();
    this.status("Timeline zoom · " + Math.round(this.zoomBarWidth / 72 * 100) + "%.");
  },

  fitTimeline() {
    const ends = this.tracks.flatMap(track => (track.clips || []).map(clip => clip.startBar + clip.lengthBars - 1));
    const bars = Math.max(8, Math.min(128, Math.ceil(Math.max(8, ...ends))));
    const width = this.root?.querySelector("[data-track-list]")?.clientWidth || 720;
    this.zoomBarWidth = Math.max(24, Math.min(288, Math.floor((width - 24) / bars)));
    this.render();
    this.scheduleProjectAutosave();
    this.status("Fit arrangement · " + bars + " bars.");
  },

  selectClip(trackId, clip, event = null) {
    this.selectedTrackId = trackId; this.selectedClipId = clip?.id || null;
    const modifierToggle = Boolean(event?.shiftKey || event?.metaKey || event?.ctrlKey);
    if (!clip) this.selectedRegionIds = [];
    else if (modifierToggle) { const current = new Set(this.selectedRegionIds || []); if (current.has(clip.id)) current.delete(clip.id); else current.add(clip.id); this.selectedRegionIds = [...current]; }
    else if (this.multiSelectMode) { const current = new Set(this.selectedRegionIds || []); current.add(clip.id); this.selectedRegionIds = [...current]; }
    else this.selectedRegionIds = [clip.id];
    this.root?.querySelectorAll(".lc-arrangement-clip").forEach(node => node.classList.toggle("selected", this.selectedRegionIds.includes(node.dataset.clipId)));
    return this.getSelectedClips();
  },
  getSelectedClips() { const ids=new Set(this.selectedRegionIds||[]); return this.tracks.flatMap(track=>(track.clips||[]).filter(clip=>ids.has(clip.id))); },
  getTempoAtBar(bar) { const point=[...this.tempoChanges].filter(item=>Number(item.bar)<=Number(bar)).sort((a,b)=>a.bar-b.bar).pop(); return Math.max(20,Math.min(300,Number(point?.bpm)||this.tempo||100)); },
  getTimeSignatureAtBar(bar) { const point=[...this.timeSignatureChanges].filter(item=>Number(item.bar)<=Number(bar)).sort((a,b)=>a.bar-b.bar).pop(); const fallback=String(this.timeSignature||"4/4").split("/"); return {numerator:Number(point?.numerator)||Number(fallback[0])||4,denominator:Number(point?.denominator)||Number(fallback[1])||4}; },
  getSecondsAtBar(bar) { const target=Math.max(1,Math.min(129,Number(bar)||1)); const boundaries=[...new Set([1,target,...this.tempoChanges.map(point=>Number(point.bar)),...this.timeSignatureChanges.map(point=>Number(point.bar))].filter(value=>value>=1&&value<=target))].sort((a,b)=>a-b); let seconds=0; for(let i=0;i<boundaries.length-1;i+=1){const start=boundaries[i],end=boundaries[i+1],meter=this.getTimeSignatureAtBar(start);seconds+=(end-start)*60/this.getTempoAtBar(start)*meter.numerator*(4/meter.denominator);} return seconds; },
  getBarAtSeconds(seconds) { const target=Math.max(0,Number(seconds)||0);let low=1,high=129;for(let i=0;i<24;i+=1){const mid=(low+high)/2;if(this.getSecondsAtBar(mid)<target)low=mid;else high=mid;}return Math.max(1,Math.min(128,low)); },
  addMarker(name,bar=this.playheadBar) { const label=String(name||"").trim().slice(0,32);if(!label)return false;this.recordHistory("Add song marker");const marker={id:"lc-marker-"+Date.now(),name:label,bar:Math.max(1,Math.min(128,Number(bar)||1))};this.markers.push(marker);this.markers.sort((a,b)=>a.bar-b.bar);this.scheduleProjectAutosave();this.render();this.status("Marker "+label+" added at bar "+marker.bar+".");return marker; },
  addTempoChange(bar,bpm) { const at=Math.max(1,Math.min(128,Math.round(Number(bar)||1))),value=Math.max(20,Math.min(300,Number(bpm)||this.tempo));this.recordHistory("Add tempo change");this.tempoChanges=this.tempoChanges.filter(point=>point.bar!==at);this.tempoChanges.push({bar:at,bpm:value});this.tempoChanges.sort((a,b)=>a.bar-b.bar);this.scheduleProjectAutosave();this.render();this.status("Tempo change · "+value+" BPM at bar "+at+".");return true; },
  addTimeSignatureChange(bar,signature) { const match=/^(2|3|4|5|6|7|8|9|12)\/(2|4|8|16)$/.exec(String(signature||""));if(!match)return false;const at=Math.max(1,Math.min(128,Math.round(Number(bar)||1)));this.recordHistory("Add time signature change");this.timeSignatureChanges=this.timeSignatureChanges.filter(point=>point.bar!==at);this.timeSignatureChanges.push({bar:at,numerator:Number(match[1]),denominator:Number(match[2])});this.timeSignatureChanges.sort((a,b)=>a.bar-b.bar);this.scheduleProjectAutosave();this.render();this.status("Time signature "+signature+" begins at bar "+at+".");return true; },
  setLoopRange(startBar,endBar,enabled=true) { const start=Math.max(1,Math.min(127,Number(startBar)||1)),end=Math.max(start+.25,Math.min(129,Number(endBar)||start+8));this.recordHistory("Set cycle range");this.loopRange={enabled:Boolean(enabled),startBar:start,endBar:end};this.scheduleProjectAutosave();this.render();this.status((enabled?"Cycle enabled · ":"Cycle range set · ")+"bar "+start+" to "+end+"."); },
  assignTrackGroup(trackId,name) { const track=this.tracks.find(item=>item.id===trackId),label=String(name||"").trim().slice(0,32);if(!track||!label)return false;this.recordHistory("Assign track group");const groupId="lc-group-"+label.toLowerCase().replace(/[^a-z0-9]+/g,"-");track.groupId=groupId;track.groupName=label;track.groupCollapsed=false;this.tracks.filter(item=>item.groupId===groupId).forEach(item=>{item.groupName=label;item.groupCollapsed=false;});this.scheduleProjectAutosave();this.render();this.status(track.name+" assigned to "+label+".");return true; },
  toggleTrackGroup(trackId) { const track=this.tracks.find(item=>item.id===trackId);if(!track?.groupId)return false;const members=this.tracks.filter(item=>item.groupId===track.groupId),collapsed=!members.every(item=>item.groupCollapsed);this.recordHistory("Toggle track folder");members.forEach(item=>item.groupCollapsed=collapsed);this.render();this.scheduleProjectAutosave();return true; },
  toggleFollowPlayhead() { this.followPlayhead=!this.followPlayhead;this.scheduleProjectAutosave();this.status("Follow playhead "+(this.followPlayhead?"on.":"off."));return this.followPlayhead; },
  toggleMultiSelect() { this.multiSelectMode=!this.multiSelectMode;this.status("Multi-region selection "+(this.multiSelectMode?"on · tap regions to add them.":"off."));return this.multiSelectMode; },


  compSelectedTake() {
    const sourceTrack = this.tracks.find(track => track.id === this.selectedTrackId);
    const sourceClip = sourceTrack?.clips?.find(clip => clip.id === this.selectedClipId);
    if (!sourceTrack || !sourceClip || !sourceClip.blob?.size || !sourceClip.takeGroupId || sourceClip.isComp) {
      this.status("Select an audio take region to add it to the vocal comp.");
      return false;
    }
    let compTrack = this.tracks.find(track => track.compForTrackId === sourceTrack.id);
    const start = Number(sourceClip.startBar) || 1;
    const end = start + Math.max(.0625, Number(sourceClip.lengthBars) || 1);
    if (compTrack) {
      const overlap = compTrack.clips.find(clip => start < clip.startBar + clip.lengthBars && end > clip.startBar);
      if (overlap && (Math.abs(overlap.startBar - start) > .001 || Math.abs(overlap.lengthBars - (end - start)) > .001)) {
        this.status("This comp section overlaps a different range. Split or trim the comp first.");
        return false;
      }
    }
    this.arrangementPlayback?.stop();
    this.recordHistory("Add take region to comp");
    if (!compTrack) {
      compTrack = this.createTrack("audio", sourceTrack.name + " · COMP");
      compTrack.compForTrackId = sourceTrack.id;
      compTrack.volume = sourceTrack.volume;
      compTrack.pan = sourceTrack.pan;
    }
    if (compTrack) compTrack.clips = compTrack.clips.filter(clip => !(Math.abs(clip.startBar - start) < .001 && Math.abs(clip.lengthBars - (end - start)) < .001));
    const compClip = {
      ...sourceClip,
      id: "lc-comp-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
      name: "COMP · TAKE " + (Number(sourceClip.takeNumber) || 1),
      isComp: true,
      compSourceClipId: sourceClip.id,
      compSourceTakeNumber: Number(sourceClip.takeNumber) || 1,
      takeGroupId: null,
      takeNumber: 0,
      takeProtected: false
    };
    compTrack.clips.push(compClip);
    sourceTrack.muted = true;
    this.arrangementPlayback?.syncTrackState(this.tracks);
    this.selectedTrackId = compTrack.id;
    this.selectedClipId = compClip.id;
    this.render();
    this.scheduleProjectAutosave();
    this.status("Take " + compClip.compSourceTakeNumber + " placed in " + compTrack.name + ". Original take preserved.");
    return true;
  },


  duplicateSelectedClip() {
    const track = this.tracks.find(item => item.id === this.selectedTrackId);
    const clip = track?.clips?.find(item => item.id === this.selectedClipId);
    if (!track || !clip) return false;
    this.recordHistory("Duplicate audio region");
    const copy = {
      ...clip,
      id: "lc-clip-copy-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
      name: (clip.name || "Audio Clip") + " Copy",
      startBar: Math.min(128 - clip.lengthBars + 1, clip.startBar + clip.lengthBars)
    };
    track.clips.push(copy);
    this.selectedClipId = copy.id;
    this.render();
    this.status("Duplicated region to bar " + copy.startBar + ".");
    return true;
  },

  deleteSelectedClip() {
    const track = this.tracks.find(item => item.id === this.selectedTrackId);
    const index = track?.clips?.findIndex(clip => clip.id === this.selectedClipId) ?? -1;
    if (!track || index < 0) return false;
    if (track.clips[index].takeProtected) {
      this.status("This recording take is protected. Unlock it before deleting.");
      return false;
    }
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
    const deleted = this.deletedItems[this.deletedItems.length - 1];
    if (!deleted) return false;
    this.recordHistory("Restore deleted item");
    this.deletedItems.pop();
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
    if (this.isTrackRecording()) return;
    if (!this.activeProjectId) {
      this.activeProjectId = "lc-daw-" + (globalThis.crypto?.randomUUID?.() || (Date.now() + "-" + Math.random().toString(36).slice(2, 8)));
    }
    this.dirty = true;
    this.saveState = "pending";
    this.status("Unsaved changes · auto-save pending.");
    clearTimeout(this.autosaveTimer);
    this.autosaveTimer = setTimeout(() => {
      if (this.savePromise) {
        this.savePromise.finally(() => this.scheduleProjectAutosave());
        return;
      }
      const projectId = this.activeProjectId;
      const projectName = this.activeProjectName;
      this.saveState = "saving";
      this.status("Saving " + projectName + "…");
      this.savePromise = (async () => {
        const session = this.createSessionSnapshot(projectName);
        await StudioDAWSessionStore.saveRecovery(projectId, session);
        await StudioDAWSessionStore.save(projectId, session);
        await StudioDAWSessionStore.clearRecovery(projectId);
        if (this.activeProjectId === projectId) {
          this.dirty = false;
          this.saveState = "saved";
          this.status("All changes saved · " + projectName + ".");
        }
      })().catch(error => {
        this.saveState = "error";
        this.status("AUTO-SAVE FAILED · " + (error?.message || error) + " · Export a session backup.");
      }).finally(() => { this.savePromise = null; });
    }, 850);
  },

  async toggleMetronome() {
    this.metronomeSettings = { ...(this.metronomeSettings || {}), enabled: !this.metronomeSettings?.enabled };
    try {
      this.arrangementPlayback?.refreshMetronome(this.playheadBar);
      if (this.isTrackRecording() && !this.arrangementPlayback?.playing) {
        stopStudioMetronome(this.recordingMetronomeSources);
        if (this.metronomeSettings.enabled) {
          const audio = await StudioAudioEngine.resume();
          const elapsed = Math.max(0, audio.currentTime - this.recordingMetronomeStartTime);
          const currentBar = this.getBarAtSeconds(this.getSecondsAtBar(this.recordingMetronomeStartBar) + elapsed);
          this.recordingMetronomeSources = scheduleStudioMetronome(audio, {
            startBar: currentBar,
            endBar: this.recordingMetronomeEndBar,
            startTime: audio.currentTime + 0.06,
            getSecondsAtBar: bar => this.getSecondsAtBar(bar),
            getTimeSignatureAtBar: bar => this.getTimeSignatureAtBar(bar),
            volume: this.metronomeSettings.volume,
            accent: this.metronomeSettings.accent
          });
        }
      }
    } catch (error) {
      this.metronomeSettings.enabled = false;
      stopStudioMetronome(this.recordingMetronomeSources);
      this.arrangementPlayback?.refreshMetronome(this.playheadBar);
      this.status("Metronome could not start: " + (error?.message || error));
      this.onRender?.();
      return false;
    }
    this.scheduleProjectAutosave();
    this.status("Metronome " + (this.metronomeSettings.enabled ? "on." : "off."));
    this.onRender?.();
    return this.metronomeSettings.enabled;
  },

  setMetronomeVolume(value) {
    const volume = Math.max(0, Math.min(0.4, Number(value) || 0));
    this.metronomeSettings = { ...(this.metronomeSettings || {}), volume };
    this.arrangementPlayback?.refreshMetronome(this.playheadBar);
    this.scheduleProjectAutosave();
    return volume;
  },

  listSessionLayouts() {
    return listStudioDAWSessionLayouts();
  },

  applySessionLayout(layoutId) {
    return applyStudioDAWSessionLayout(this, layoutId);
  },

  setMasterLimiter(enabled, ceilingDb = this.masterSettings?.limiterCeilingDb ?? -1) {
    const settings = StudioAudioEngine.setMasterLimiter(enabled, ceilingDb);
    this.masterSettings = { ...(this.masterSettings || {}), limiterEnabled: settings.enabled, limiterCeilingDb: settings.ceilingDb };
    this.scheduleProjectAutosave();
    this.onRender?.();
    return settings;
  },

  setTempo(value) {
    const bpm = Number(value);

    if (!Number.isFinite(bpm)) return;
    const next = Math.max(60, Math.min(180, bpm));
    if (next !== this.tempo) this.recordHistory("Change tempo");
    this.tempo = next;
    this.scheduleProjectAutosave();
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
          getSecondsAtBar: bar => this.getSecondsAtBar(bar),
          getTimeSignatureAtBar: bar => this.getTimeSignatureAtBar(bar),
          getMetronomeSettings: () => this.metronomeSettings,
          getBarAtSeconds: seconds => this.getBarAtSeconds(seconds),
          onPosition: bar => {
            this.playheadBar = bar;
            const x = (bar - 1) * this.zoomBarWidth;
            this.root?.querySelectorAll(".lc-arrangement-playhead").forEach(line => { line.style.left = x + "px"; });
            const label = this.root?.querySelector("[data-ruler-label]");
            if (label) label.textContent = "BAR 01 — 128 · PLAYHEAD " + String(bar).padStart(2, "0");
            const clock = this.root?.querySelector("[data-clock]");
            if (clock) { const meter=this.getTimeSignatureAtBar(bar); clock.textContent=Math.round(this.getTempoAtBar(bar))+" BPM / "+meter.numerator+"/"+meter.denominator+" · BAR "+Math.floor(bar); }
            if (this.followPlayhead) this.root?.querySelectorAll(".lc-arrangement").forEach(scroll => {
              if (x < scroll.scrollLeft + 18 || x > scroll.scrollLeft + scroll.clientWidth - 40) scroll.scrollLeft = Math.max(0, x - scroll.clientWidth * .25);
            });
          },
          onStatus: message => this.status(message)
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
      instrumentWave: "triangle",
      eq: { low: 0, mid: 0, high: 0 },
      compression: { threshold: -18, ratio: 1 },
      effects: { delayTime: 0.28, delayFeedback: 0.25, delayMix: 0, reverbMix: 0, reverbDecay: 2.2, pitchCorrection: { enabled: false, root: 0, scale: "major", amount: 100, speedMs: 25 } },
      automation: { volume: [] },
      muted: false,
      solo: false,
      armed: false,
      groupId: null,
      groupName: null,
      groupCollapsed: false,
      outputBusId: null,
      sends: [],
      midiNotes: [],
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

  createSessionSnapshot(projectName = this.activeProjectName) {
    return {
      format: "lambo-city-daw-session",
      version: 1,
      projectName: String(projectName || "Untitled Song").trim() || "Untitled Song",
      updatedAt: new Date().toISOString(),
      tempo: this.tempo,
      timeSignature: this.timeSignature,
      tempoChanges: this.tempoChanges.map(point => ({ ...point })),
      timeSignatureChanges: this.timeSignatureChanges.map(point => ({ ...point })),
      markers: this.markers.map(marker => ({ ...marker })),
      loopRange: { ...this.loopRange },
      followPlayhead: this.followPlayhead,
      zoomBarWidth: this.zoomBarWidth,
      playheadBar: this.playheadBar,
      snapMode: this.snapMode,
      inputDeviceId: this.inputDeviceId || "",
      inputLatencyMs: Math.max(0, Math.min(500, Number(this.inputLatencyMs) || 0)),
      inputLatencyByDevice: { ...(this.inputLatencyByDevice || {}) },
      masterSettings: { ...(this.masterSettings || { volume: 100, stereoWidth: 100, compressionRatio: 3, limiterEnabled: true, limiterCeilingDb: -1 }) },
      metronomeSettings: { ...(this.metronomeSettings || { enabled: false, volume: 0.16, accent: true }) },
      templateId: this.sessionTemplateId,
      templateName: this.sessionTemplateName,
      deletedItems: this.deletedItems,
      tracks: this.tracks.map(track => ({
        ...track,
        clips: (track.clips || []).filter(clip => clip.blob instanceof Blob && clip.blob.size > 0).map(clip => ({ ...clip, objectUrl: undefined }))
      }))
    };
  },

  async saveSession(projectId, projectName = this.activeProjectName, { createVersion = true } = {}) {
    if (this.isTrackRecording() || this.pendingRecording) throw new Error("Stop the active or scheduled recording before saving the song session.");
    if (!projectId) throw new Error("A project ID is required before saving.");
    const session = this.createSessionSnapshot(projectName);
    const previous = createVersion ? await StudioDAWSessionStore.load(projectId) : null;
    if (createVersion && previous) await StudioDAWSessionStore.saveVersion(projectId, previous, "Before manual save");
    await StudioDAWSessionStore.save(projectId, session);
    if (createVersion) await StudioDAWSessionStore.saveVersion(projectId, session, "Manual save");
    await StudioDAWSessionStore.clearRecovery(projectId);
    this.activeProjectId = projectId;
    this.activeProjectName = session.projectName;
    this.dirty = false;
    this.saveState = "saved";
    clearTimeout(this.autosaveTimer);
    this.status("Saved · " + this.activeProjectName + ".");
    return true;
  },

  async listSessionVersions(projectId = this.activeProjectId) {
    return projectId ? StudioDAWSessionStore.listVersions(projectId) : [];
  },

  async restoreSessionVersion(versionId) {
    const record = await StudioDAWSessionStore.loadVersion(versionId);
    if (!record?.session) throw new Error("The selected session version is unavailable.");
    await this.loadSession(record.projectId, { sessionOverride: record.session });
    this.activeProjectId = record.projectId;
    this.activeProjectName = record.projectName || record.session.projectName || "Untitled Song";
    this.dirty = true;
    this.scheduleProjectAutosave();
    this.status("Version restored · " + record.label + ".");
    return true;
  },

  async recoverUnsavedSession(projectId = this.activeProjectId) {
    if (!projectId) return false;
    const recovery = await StudioDAWSessionStore.loadRecovery(projectId);
    if (!recovery || recovery.format !== "lambo-city-daw-session" || !Array.isArray(recovery.tracks)) return false;
    const saved = await StudioDAWSessionStore.load(projectId);
    if (saved?.updatedAt && recovery.updatedAt && saved.updatedAt >= recovery.updatedAt) {
      await StudioDAWSessionStore.clearRecovery(projectId);
      return false;
    }
    await this.loadSession(projectId, { sessionOverride: recovery });
    this.activeProjectId = projectId;
    this.activeProjectName = recovery.projectName || "Recovered Song";
    this.dirty = true;
    this.saveState = "pending";
    this.scheduleProjectAutosave();
    this.status("Recovered unsaved work · saving checkpoint.");
    return true;
  },
  async loadSession(projectId, { sessionOverride = null } = {}) {
    if (this.isTrackRecording() || this.pendingRecording) {
      throw new Error("Stop the active track recording before loading another song session.");
    }
    const session = sessionOverride || await StudioDAWSessionStore.load(projectId);
    if (!this.validateSessionData(session)) throw new Error("Saved session failed validation and was not opened.");
    this.stopAll();
    this.tempo = Math.max(60, Math.min(180, Number(session.tempo) || 100));
    this.timeSignature = /^(2|3|4|5|6|7|8|9|12)\/(2|4|8|16)$/.test(session.timeSignature) ? session.timeSignature : "4/4";
    this.tempoChanges = Array.isArray(session.tempoChanges) ? session.tempoChanges.map(point=>({bar:Math.max(1,Math.min(128,Number(point.bar)||1)),bpm:Math.max(20,Math.min(300,Number(point.bpm)||100))})) : [];
    this.timeSignatureChanges = Array.isArray(session.timeSignatureChanges) ? session.timeSignatureChanges.map(point=>({bar:Math.max(1,Math.min(128,Number(point.bar)||1)),numerator:Number(point.numerator)||4,denominator:Number(point.denominator)||4})) : [];
    this.markers = Array.isArray(session.markers) ? session.markers.map(marker=>({id:marker.id||"lc-marker-"+Date.now(),name:String(marker.name||"Marker").slice(0,32),bar:Math.max(1,Math.min(128,Number(marker.bar)||1))})) : [];
    this.loopRange = {enabled:Boolean(session.loopRange?.enabled),startBar:Math.max(1,Math.min(127,Number(session.loopRange?.startBar)||1)),endBar:Math.max(2,Math.min(129,Number(session.loopRange?.endBar)||9))};
    this.followPlayhead = session.followPlayhead !== false;
    this.zoomBarWidth = Math.max(24, Math.min(288, Number(session.zoomBarWidth) || 72));
    this.playheadBar = Math.max(1, Math.min(128, Number(session.playheadBar) || 1));
    this.snapMode = ["bars", "beats", "subdivisions", "seconds", "off"].includes(session.snapMode) ? session.snapMode : "bars";
    this.inputDeviceId = session.inputDeviceId || "";
    this.inputLatencyMs = Math.max(0, Math.min(500, Number(session.inputLatencyMs) || 0));
    this.inputLatencyByDevice = session.inputLatencyByDevice && typeof session.inputLatencyByDevice === "object" ? { ...session.inputLatencyByDevice } : {};
    this.masterSettings = { volume: Math.max(0, Math.min(100, Number(session.masterSettings?.volume ?? 100))), stereoWidth: Math.max(0, Math.min(200, Number(session.masterSettings?.stereoWidth ?? 100))), compressionRatio: Math.max(1, Math.min(8, Number(session.masterSettings?.compressionRatio ?? 3))), limiterEnabled: session.masterSettings?.limiterEnabled !== false, limiterCeilingDb: Math.max(-6, Math.min(0, Number(session.masterSettings?.limiterCeilingDb ?? -1))) };
    this.metronomeSettings = { enabled: Boolean(session.metronomeSettings?.enabled), volume: Math.max(0, Math.min(0.4, Number(session.metronomeSettings?.volume ?? 0.16))), accent: session.metronomeSettings?.accent !== false };
    StudioAudioEngine.setMasterVolume(this.masterSettings.volume / 100);
    StudioAudioEngine.setStereoWidth(this.masterSettings.stereoWidth);
    StudioAudioEngine.setMasterCompressionRatio(this.masterSettings.compressionRatio);
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
    this.selectedRegionIds = [];
    this.render();
    this.dirty = false;
    this.saveState = "saved";
    if (!sessionOverride) await StudioDAWSessionStore.clearRecovery(projectId);
    this.status("Saved song session restored with " + this.tracks.length + " track(s).");
    return true;
  },

  validateSessionData(session) {
    if (!session || session.format !== "lambo-city-daw-session" || session.version !== 1 || !Array.isArray(session.tracks) || session.tracks.length > 64) return false;
    const trackIds = new Set();
    const clipIds = new Set();
    for (const track of session.tracks) {
      if (!track || typeof track.id !== "string" || !track.id || trackIds.has(track.id) || !TRACK_TYPES.includes(track.type || "audio") || !Array.isArray(track.clips) || track.clips.length > 512) return false;
      trackIds.add(track.id);
      for (const clip of track.clips) {
        if (!clip || typeof clip.id !== "string" || !clip.id || clipIds.has(clip.id) || !Number.isFinite(Number(clip.startBar)) || Number(clip.startBar) < 1 || Number(clip.startBar) > 128 || !Number.isFinite(Number(clip.lengthBars)) || Number(clip.lengthBars) <= 0) return false;
        clipIds.add(clip.id);
        if (clip.blob !== undefined && !(clip.blob instanceof Blob)) return false;
        if (clip.blob === undefined) {
          const asset = clip.audioAssetId ? session.audioAssets?.[clip.audioAssetId] : null;
          const encoded = asset?.data || clip.data;
          if (typeof encoded !== "string" || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) return false;
        }
      }
    }
    const busIds = new Set(session.tracks.filter(track => track.type === "bus").map(track => track.id));
    for (const track of session.tracks) {
      if (track.instrumentWave !== undefined && !["sine", "triangle", "sawtooth", "square"].includes(track.instrumentWave)) return false;
      if (track.midiNotes !== undefined && (!Array.isArray(track.midiNotes) || track.midiNotes.length > 4096 || !track.midiNotes.every(note => Number.isInteger(Number(note.pitch)) && Number(note.pitch) >= 0 && Number(note.pitch) <= 127 && Number.isFinite(Number(note.startBar)) && Number(note.startBar) >= 1 && Number(note.startBar) <= 128 && Number.isFinite(Number(note.lengthBars)) && Number(note.lengthBars) > 0 && Number(note.lengthBars) <= 16 && Number.isFinite(Number(note.velocity ?? 0.8)) && Number(note.velocity ?? 0.8) >= 0 && Number(note.velocity ?? 0.8) <= 1))) return false;
      if (track.outputBusId && (!busIds.has(track.outputBusId) || track.type === "bus")) return false;
      if (track.sends !== undefined && (!Array.isArray(track.sends) || track.sends.length > 32 || !track.sends.every(send => typeof send.busId === "string" && busIds.has(send.busId) && track.type !== "bus" && Number.isFinite(Number(send.level)) && Number(send.level) >= 0 && Number(send.level) <= 100))) return false;
    }
    if (session.metronomeSettings !== undefined && (typeof session.metronomeSettings.enabled !== "boolean" || !Number.isFinite(Number(session.metronomeSettings.volume)) || Number(session.metronomeSettings.volume) < 0 || Number(session.metronomeSettings.volume) > 0.4 || typeof session.metronomeSettings.accent !== "boolean")) return false;
    if (session.masterSettings !== undefined && (!Number.isFinite(Number(session.masterSettings.volume)) || Number(session.masterSettings.volume) < 0 || Number(session.masterSettings.volume) > 100 || !Number.isFinite(Number(session.masterSettings.stereoWidth)) || Number(session.masterSettings.stereoWidth) < 0 || Number(session.masterSettings.stereoWidth) > 200 || !Number.isFinite(Number(session.masterSettings.compressionRatio)) || Number(session.masterSettings.compressionRatio) < 1 || Number(session.masterSettings.compressionRatio) > 8 || (session.masterSettings.limiterEnabled !== undefined && typeof session.masterSettings.limiterEnabled !== "boolean") || (session.masterSettings.limiterCeilingDb !== undefined && (!Number.isFinite(Number(session.masterSettings.limiterCeilingDb)) || Number(session.masterSettings.limiterCeilingDb) < -6 || Number(session.masterSettings.limiterCeilingDb) > 0))) return false;
    return Number.isFinite(Number(session.tempo)) && Number(session.tempo) >= 20 && Number(session.tempo) <= 300;
  },

  async findLatestRecovery() {
    const checkpoints = await StudioDAWSessionStore.listRecovery();
    for (const checkpoint of checkpoints) {
      const recovery = await StudioDAWSessionStore.loadRecovery(checkpoint.projectId);
      const saved = await StudioDAWSessionStore.load(checkpoint.projectId);
      if (recovery && (!saved?.updatedAt || !recovery.updatedAt || recovery.updatedAt > saved.updatedAt)) return checkpoint;
      await StudioDAWSessionStore.clearRecovery(checkpoint.projectId);
    }
    return null;
  },

  async removeSavedSession(projectId) {
    return StudioDAWSessionStore.remove(projectId);
  },

  resetSession({ tempo = 100 } = {}) {
    if (this.isTrackRecording() || this.pendingRecording) {
      throw new Error("Stop the active track recording before starting a new song session.");
    }
    this.stopAll();
    this.tempo = Math.max(60, Math.min(180, Number(tempo) || 100));
    this.timeSignature = "4/4"; this.tempoChanges = []; this.timeSignatureChanges = []; this.markers = []; this.loopRange = { enabled: false, startBar: 1, endBar: 9 }; this.masterSettings = { volume: 100, stereoWidth: 100, compressionRatio: 3, limiterEnabled: true, limiterCeilingDb: -1 }; StudioAudioEngine.setMasterVolume(1); StudioAudioEngine.setStereoWidth(100); StudioAudioEngine.setMasterCompressionRatio(3); this.followPlayhead = true; this.selectedRegionIds = []; this.multiSelectMode = false;
    this.sessionTemplateId = null;
    this.sessionTemplateName = null;
    this.tracks = [];
    this.deletedItems = [];
    this.dirty = true;
    this.saveState = "pending";
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
    if (this.isTrackRecording() || this.pendingRecording) {
      throw new Error("Stop the active track recording before exporting the song project.");
    }
    let encodedBytes = 0;
    let nextAudioAssetId = 1;
    const audioAssets = {};
    const audioAssetIds = new Map();
    const tracks = [];
    for (const track of this.tracks) {
      const clips = [];
      for (const clip of (track.clips || [])) {
        if (!(clip.blob instanceof Blob) || !clip.blob.size) continue;
        let audioAssetId = audioAssetIds.get(clip.blob);
        if (!audioAssetId) {
          encodedBytes += clip.blob.size;
          if (encodedBytes > MAX_PORTABLE_SESSION_BYTES) {
            throw new Error("Session audio exceeds the 30 MB portable audio limit. Export fewer or shorter audio clips.");
          }
          audioAssetId = "audio-" + nextAudioAssetId++;
          audioAssetIds.set(clip.blob, audioAssetId);
          audioAssets[audioAssetId] = { mimeType: clip.blob.type || "application/octet-stream", data: await encodeAudioBlob(clip.blob) };
        }
        clips.push({
          id: clip.id,
          name: clip.name || "Audio Clip",
          startBar: Number(clip.startBar) || 1,
          lengthBars: Number(clip.lengthBars) || 4,
          duration: Number(clip.duration) || 0,
          sourceOffsetSeconds: Number(clip.sourceOffsetSeconds) || 0,
          playDurationSeconds: Number(clip.playDurationSeconds) || 0,
          clipGainDb: Math.max(-24, Math.min(12, Number(clip.clipGainDb) || 0)),
          fadeInSeconds: Math.max(0, Number(clip.fadeInSeconds) || 0),
          fadeOutSeconds: Math.max(0, Number(clip.fadeOutSeconds) || 0),
          latencyCompensationMs: Math.max(0, Math.min(500, Number(clip.latencyCompensationMs) || 0)),
          mimeType: clip.blob.type || "application/octet-stream",
          audioAssetId,
          takeId: clip.takeId || null,
          takeGroupId: clip.takeGroupId || null,
          takeNumber: Math.max(0, Number(clip.takeNumber) || 0),
          takeProtected: Boolean(clip.takeProtected),
          createdAt: clip.createdAt || null,
          isComp: Boolean(clip.isComp),
          compSourceClipId: clip.compSourceClipId || null,
          compSourceTakeNumber: Math.max(0, Number(clip.compSourceTakeNumber) || 0)
        });
      }
      tracks.push({
        id: track.id,
        name: track.name,
        type: TRACK_TYPES.includes(track.type) ? track.type : "audio",
        volume: Math.max(0, Math.min(100, Number(track.volume) || 0)),
        pan: Math.max(-1, Math.min(1, Number(track.pan) || 0)),
        inputSource: ["mic", "beatlab", "mpc"].includes(track.inputSource) ? track.inputSource : "mic",
        instrumentWave: ["sine", "triangle", "sawtooth", "square"].includes(track.instrumentWave) ? track.instrumentWave : "triangle",
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
        compForTrackId: track.compForTrackId || null,
        groupId: track.groupId || null,
        groupName: track.groupName || null,
        groupCollapsed: Boolean(track.groupCollapsed),
        outputBusId: track.outputBusId || null,
        sends: (track.sends || []).map(send => ({ busId: send.busId, level: Math.max(0, Math.min(100, Number(send.level) || 0)) })),
        midiNotes: (track.midiNotes || []).map(note => ({ id: note.id, pitch: Number(note.pitch), startBar: Number(note.startBar), lengthBars: Number(note.lengthBars), velocity: Number(note.velocity ?? 0.8) })),
        clips
      });
    }
    return {
      format: "lambo-city-daw-session",
      version: 1,
      projectName: this.activeProjectName || "Untitled Song",
      tempo: this.tempo,
      timeSignature: this.timeSignature,
      tempoChanges: this.tempoChanges.map(point=>({...point})),
      timeSignatureChanges: this.timeSignatureChanges.map(point=>({...point})),
      markers: this.markers.map(marker=>({...marker})),
      loopRange: {...this.loopRange},
      followPlayhead: this.followPlayhead,
      zoomBarWidth: this.zoomBarWidth,
      playheadBar: this.playheadBar,
      inputDeviceId: this.inputDeviceId || "",
      inputLatencyMs: Math.max(0, Math.min(500, Number(this.inputLatencyMs) || 0)),
      inputLatencyByDevice: { ...(this.inputLatencyByDevice || {}) },
      masterSettings: { ...(this.masterSettings || { volume: 100, stereoWidth: 100, compressionRatio: 3, limiterEnabled: true, limiterCeilingDb: -1 }) },
      templateId: this.sessionTemplateId,
      templateName: this.sessionTemplateName,
      audioAssets,
      tracks
    };
  },

  importSession(session) {
    if (this.isTrackRecording() || this.pendingRecording) {
      throw new Error("Stop the active track recording before importing another song session.");
    }
    if (!session || session.format !== "lambo-city-daw-session" ||
        session.version !== 1 || !Array.isArray(session.tracks)) {
      throw new Error("The portable DAW session is invalid.");
    }
    this.stopAll();
    this.tempo = Math.max(60, Math.min(180, Number(session.tempo) || 100));
    this.timeSignature = /^(2|3|4|5|6|7|8|9|12)\/(2|4|8|16)$/.test(session.timeSignature) ? session.timeSignature : "4/4";
    this.tempoChanges = Array.isArray(session.tempoChanges) ? session.tempoChanges.map(point=>({bar:Math.max(1,Math.min(128,Number(point.bar)||1)),bpm:Math.max(20,Math.min(300,Number(point.bpm)||100))})) : [];
    this.timeSignatureChanges = Array.isArray(session.timeSignatureChanges) ? session.timeSignatureChanges.map(point=>({bar:Math.max(1,Math.min(128,Number(point.bar)||1)),numerator:Number(point.numerator)||4,denominator:Number(point.denominator)||4})) : [];
    this.markers = Array.isArray(session.markers) ? session.markers.map(marker=>({id:marker.id||"lc-marker-"+Date.now(),name:String(marker.name||"Marker").slice(0,32),bar:Math.max(1,Math.min(128,Number(marker.bar)||1))})) : [];
    this.loopRange = {enabled:Boolean(session.loopRange?.enabled),startBar:Math.max(1,Math.min(127,Number(session.loopRange?.startBar)||1)),endBar:Math.max(2,Math.min(129,Number(session.loopRange?.endBar)||9))};
    this.followPlayhead = session.followPlayhead !== false;
    this.zoomBarWidth = Math.max(24, Math.min(288, Number(session.zoomBarWidth) || 72));
    this.playheadBar = Math.max(1, Math.min(128, Number(session.playheadBar) || 1));
    this.snapMode = ["bars", "beats", "subdivisions", "seconds", "off"].includes(session.snapMode) ? session.snapMode : "bars";
    this.inputDeviceId = session.inputDeviceId || "";
    this.inputLatencyMs = Math.max(0, Math.min(500, Number(session.inputLatencyMs) || 0));
    this.inputLatencyByDevice = session.inputLatencyByDevice && typeof session.inputLatencyByDevice === "object" ? { ...session.inputLatencyByDevice } : {};
    this.masterSettings = { volume: Math.max(0, Math.min(100, Number(session.masterSettings?.volume ?? 100))), stereoWidth: Math.max(0, Math.min(200, Number(session.masterSettings?.stereoWidth ?? 100))), compressionRatio: Math.max(1, Math.min(8, Number(session.masterSettings?.compressionRatio ?? 3))) };
    StudioAudioEngine.setMasterVolume(this.masterSettings.volume / 100);
    StudioAudioEngine.setStereoWidth(this.masterSettings.stereoWidth);
    StudioAudioEngine.setMasterCompressionRatio(this.masterSettings.compressionRatio);
    this.sessionTemplateId = session.templateId || null;
    this.sessionTemplateName = session.templateName || null;
    this.deletedItems = [];
    const importedAudioAssets = new Map();
    this.tracks = session.tracks.map((savedTrack, index) => ({
      id: savedTrack.id || `lc-track-import-${index + 1}`,
      name: String(savedTrack.name || `Track ${index + 1}`),
      type: TRACK_TYPES.includes(savedTrack.type) ? savedTrack.type : "audio",
      volume: Math.max(0, Math.min(100, Number(savedTrack.volume) || 0)),
      pan: Math.max(-1, Math.min(1, Number(savedTrack.pan) || 0)),
      inputSource: ["mic", "beatlab", "mpc"].includes(savedTrack.inputSource) ? savedTrack.inputSource : "mic",
      instrumentWave: ["sine", "triangle", "sawtooth", "square"].includes(savedTrack.instrumentWave) ? savedTrack.instrumentWave : "triangle",
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
      compForTrackId: savedTrack.compForTrackId || null,
      groupId: savedTrack.groupId || null,
      groupName: savedTrack.groupName || null,
      groupCollapsed: Boolean(savedTrack.groupCollapsed),
      outputBusId: savedTrack.outputBusId || null,
      sends: Array.isArray(savedTrack.sends) ? savedTrack.sends.map(send => ({ busId: send.busId, level: Math.max(0, Math.min(100, Number(send.level) || 0)) })) : [],
      midiNotes: Array.isArray(savedTrack.midiNotes) ? savedTrack.midiNotes.map(note => ({ id: note.id || "midi-" + Date.now(), pitch: Math.max(0, Math.min(127, Number(note.pitch) || 60)), startBar: Math.max(1, Math.min(128, Number(note.startBar) || 1)), lengthBars: Math.max(0.0625, Math.min(16, Number(note.lengthBars) || 0.25)), velocity: Math.max(0, Math.min(1, Number(note.velocity ?? 0.8))) })) : [],
      clips: (savedTrack.clips || []).map(clip => ({
        id: clip.id,
        name: clip.name || "Audio Clip",
        startBar: Math.max(1, Number(clip.startBar) || 1),
        lengthBars: Math.max(0.0625, Number(clip.lengthBars) || 4),
        duration: Number(clip.duration) || 0,
        sourceOffsetSeconds: Number(clip.sourceOffsetSeconds) || 0,
        playDurationSeconds: Number(clip.playDurationSeconds) || 0,
        clipGainDb: Math.max(-24, Math.min(12, Number(clip.clipGainDb) || 0)),
        fadeInSeconds: Math.max(0, Number(clip.fadeInSeconds) || 0),
        fadeOutSeconds: Math.max(0, Number(clip.fadeOutSeconds) || 0),
        latencyCompensationMs: Math.max(0, Math.min(500, Number(clip.latencyCompensationMs) || 0)),
        blob: decodeSessionClipAudio(clip, session.audioAssets, importedAudioAssets),
        takeId: clip.takeId || null,
        takeGroupId: clip.takeGroupId || null,
        takeNumber: Math.max(0, Number(clip.takeNumber) || 0),
        takeProtected: Boolean(clip.takeProtected),
        createdAt: clip.createdAt || null,
        isComp: Boolean(clip.isComp),
        compSourceClipId: clip.compSourceClipId || null,
        compSourceTakeNumber: Math.max(0, Number(clip.compSourceTakeNumber) || 0)
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
        <button type="button" data-edit-action="duplicate">DUPLICATE</button>
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
        if (editAction === "duplicate") this.duplicateSelectedClip();
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
      this.scheduleProjectAutosave();
    });

    root.addEventListener("change", event => {
      if (event.target.matches("[data-volume], [data-pan]")) {
        delete event.target.dataset.historyStarted;
        delete event.target.dataset.historyValue;
      }
    });

    this.render();

    return root;
  },

  async startArmedRecording({ vocalEffects, countInBars = 0, punchInBar = null, punchOutBar = null, monitorInput = false } = {}) {
    if (this.pendingRecording || this.isTrackRecording()) {
      this.status("A recording is already scheduled or active.");
      return false;
    }
    let armedTracks = this.tracks.filter(track => track.armed && track.type === "audio");
    if (armedTracks.length === 0) {
      const defaultInputTrack = this.tracks.find(track => track.type === "audio" && /vocal/i.test(track.name))
        || this.tracks.find(track => track.type === "audio");
      if (defaultInputTrack) {
        defaultInputTrack.armed = true;
        armedTracks = [defaultInputTrack];
        this.render();
        this.status("Automatically armed " + defaultInputTrack.name + " for microphone recording.");
      }
    }
    if (armedTracks.length !== 1) {
      this.status(armedTracks.length ? "Arm exactly one audio track to record." : "Add an audio track before recording.");
      return false;
    }
    const preRoll = Math.max(0, Math.min(4, Math.floor(Number(countInBars) || 0)));
    const startBar = Math.max(this.playheadBar + preRoll, Math.min(128, Number(punchInBar) || 0));
    const endBar = Number(punchOutBar) > 0 ? Math.min(128, Number(punchOutBar)) : null;
    if (endBar !== null && endBar <= startBar) {
      this.status("Punch-out must be after the recording start bar.");
      return false;
    }
    try {
      const audio = await StudioAudioEngine.resume();
      const track = armedTracks[0];
      this.pendingRecording = true;
      this.recordingStartBar = startBar;
      const barsUntilRecord = Math.max(0, startBar - this.playheadBar);
      if (barsUntilRecord > 0 && this.tracks.some(item => item.clips?.some(clip => clip.blob?.size) || ((item.type === "midi" || item.type === "instrument") && item.midiNotes?.length))) {
        await this.playAll();
      }
      const delaySeconds = Math.max(0, this.getSecondsAtBar(startBar) - this.getSecondsAtBar(this.playheadBar));
      const delayMs = delaySeconds * 1000;
      if (delayMs > 0) {
        this.status("Pre-roll · recording begins at bar " + startBar + ".");
        const countStart = audio.currentTime + 0.06;
        if (!this.metronomeSettings?.enabled || !this.arrangementPlayback?.playing) {
        for (let bar = Math.floor(this.playheadBar); bar < startBar; bar += 1) {
          const meter = this.getTimeSignatureAtBar(bar);
          const bpm = this.getTempoAtBar(bar);
          const beatSeconds = 60 / bpm * (4 / meter.denominator);
          const firstBeat = Math.max(0, Math.ceil((this.playheadBar - bar) * meter.numerator));
          for (let beat = firstBeat; beat < meter.numerator; beat += 1) {
          const at = countStart + Math.max(0, this.getSecondsAtBar(bar + beat / meter.numerator) - this.getSecondsAtBar(this.playheadBar));
          const oscillator = audio.createOscillator();
          const clickGain = audio.createGain();
          oscillator.frequency.value = beat === 0 ? 1450 : 980;
          clickGain.gain.setValueAtTime(0.0001, at);
          clickGain.gain.exponentialRampToValueAtTime(0.16, at + 0.004);
          clickGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.065);
          oscillator.connect(clickGain);
          clickGain.connect(audio.destination);
          oscillator.start(at);
          oscillator.stop(at + 0.07);
          oscillator.onended = () => { try { oscillator.disconnect(); clickGain.disconnect(); } catch {} };
          }
        }
        }
        const ready = await new Promise(resolve => {
          this.recordingScheduleResolve = resolve;
          this.recordingScheduleTimer = setTimeout(() => {
            this.recordingScheduleTimer = null;
            this.recordingScheduleResolve = null;
            resolve(Boolean(this.pendingRecording));
          }, delayMs);
        });
        if (!ready) return false;
      }
      if (!this.pendingRecording) return false;
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
        monitorInput: Boolean(monitorInput),
        inputDeviceId: track.inputSource === "mic" ? this.inputDeviceId : "",
        vocalEffects: track.inputSource === "mic" && /vocal/i.test(track.name) ? vocalEffects : null
      });
      this.recordingMetronomeStartBar = startBar;
      this.recordingMetronomeStartTime = audio.currentTime + 0.06;
      this.recordingMetronomeEndBar = endBar || 129;
      if (this.metronomeSettings?.enabled && !this.arrangementPlayback?.playing) {
        this.recordingMetronomeSources = scheduleStudioMetronome(audio, {
          startBar,
          endBar: endBar || 129,
          startTime: audio.currentTime + 0.06,
          getSecondsAtBar: bar => this.getSecondsAtBar(bar),
          getTimeSignatureAtBar: bar => this.getTimeSignatureAtBar(bar),
          volume: this.metronomeSettings.volume,
          accent: this.metronomeSettings.accent
        });
      }
      this.pendingRecording = false;
      if (endBar !== null) {
        const punchDuration = Math.max(0, this.getSecondsAtBar(endBar) - this.getSecondsAtBar(startBar)) * 1000;
        this.punchOutTimer = setTimeout(() => { this.punchOutTimer = null; void this.stopArmedRecording(); }, punchDuration);
      }
      const sourceLabel = track.inputSource === "mpc"
        ? "MPC output"
        : track.inputSource === "beatlab"
          ? "Digital Beat Lab output"
          : "microphone";
      this.status("Recording " + sourceLabel + " into " + track.name + " · bar " + startBar + (endBar !== null ? " → " + endBar : "") + ".");
      return true;
    } catch (error) {
      stopStudioMetronome(this.recordingMetronomeSources);
      this.pendingRecording = false;
      if (this.recordingScheduleTimer) clearTimeout(this.recordingScheduleTimer);
      this.recordingScheduleTimer = null;
      this.recordingScheduleResolve?.(false);
      this.recordingScheduleResolve = null;
      this.status("RECORDING ERROR: " + (error?.message || error));
      return false;
    }
  },

  cancelScheduledRecording() {
    if (!this.pendingRecording) return false;
    this.pendingRecording = false;
    if (this.recordingScheduleTimer) clearTimeout(this.recordingScheduleTimer);
    this.recordingScheduleTimer = null;
    this.recordingScheduleResolve?.(false);
    this.recordingScheduleResolve = null;
    this.stopAll();
    this.status("Scheduled recording cancelled.");
    return true;
  },

  async stopArmedRecording() {
    stopStudioMetronome(this.recordingMetronomeSources);
    if (this.punchOutTimer) clearTimeout(this.punchOutTimer);
    this.punchOutTimer = null;
    if (!StudioRecordingEngine.activeTrackTake) return false;
    try {
      const take = await StudioRecordingEngine.stopTrackRecording();
      let track = this.tracks.find(item => item.id === take.trackId);
      if (!track) track = this.createTrack("audio", "Recovered Recording");
      const context = await StudioAudioEngine.resume();
      const bytes = await take.blob.arrayBuffer();
      const buffer = await context.decodeAudioData(bytes.slice(0));
      const lengthBars = Math.max(.25, Math.min(128, this.getBarAtSeconds(this.getSecondsAtBar(this.recordingStartBar) + buffer.duration) - this.recordingStartBar));
      const latencyMs = track.inputSource === "mic" ? Math.max(0, Math.min(500, Number(this.inputLatencyMs) || 0)) : 0;
      const compensatedStartBar = Math.max(1, this.getBarAtSeconds(this.getSecondsAtBar(this.recordingStartBar) - latencyMs / 1000));
      track.clips.push({
        id: take.id,
        name: track.name + " Recording",
        blob: take.blob,
        takeId: take.id,
        startBar: compensatedStartBar,
        lengthBars,
        duration: buffer.duration,
        takeGroupId: track.id + "-takes-" + this.recordingStartBar,
        takeNumber: track.clips.filter(clip => clip.takeGroupId === track.id + "-takes-" + this.recordingStartBar).length + 1,
        takeProtected: false,
        latencyCompensationMs: latencyMs,
        recordingFormat: take.recordingFormat || "Browser MediaRecorder",
        createdAt: take.startedAt
      });
      this.scheduleProjectAutosave();
      this.render();
      this.status("Take " + track.clips[track.clips.length - 1].takeNumber + " saved to " + track.name + " at bar " + this.recordingStartBar + " · " + (take.recordingFormat || "Browser MediaRecorder") + ".");
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
      this.recordHistory("Import audio files");
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
      this.scheduleProjectAutosave();
      this.status(audioFiles.length + " audio file(s) imported into separate session track(s).");
    } catch (error) {
      this.status("AUDIO IMPORT ERROR: " + (error?.message || error));
    }
  },

   addClip(id) {
    const track = this.tracks.find(item => item.id === id);

    if (!track) return;
    this.recordHistory("Add audio region");

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

    this.recordHistory("Add recorded takes");
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
        recordingFormat: take.recordingFormat || "Browser MediaRecorder",
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
    this.scheduleProjectAutosave();

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
      track.clips?.some(clip => clip.blob && clip.blob.size > 0) ||
      ((track.type === "midi" || track.type === "instrument") && track.midiNotes?.length)
    )) {
      this.status("No recorded audio clips available.");
      return;
    }

    const loop = this.loopRange?.enabled ? this.loopRange : null;
    await this.getArrangementPlayback().play(this.tracks, this.playheadBar, loop);
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

    if (!list) { this.onRender?.(); return; }

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
    const saveState = this.root?.querySelector("[data-save-state]");
    if (saveState) {
      saveState.textContent = ({ saved: "SAVED", pending: "AUTO-SAVE PENDING", saving: "SAVING…", error: "SAVE ERROR" })[this.saveState] || "SAVED";
      saveState.dataset.state = this.saveState || "saved";
    }
  }
};

export default StudioMultitrackWorkspace;
