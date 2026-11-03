// LAMBO CITY RECORDS — MPC SAMPLE ENGINE
// Real user-owned audio samples, persistent in IndexedDB, independent of Beat Lab.
import StudioAudioExport from "./studioAudioExport.js";

const DB_NAME = "lambo-city-mpc-samples";
const STORE = "samples";
const ASSIGN_KEY = "lambocity-mpc-sample-assignments-v1";
const MASTER_KEY = "lambocity-mpc-master-v1";
let dbPromise;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { dbPromise = null; reject(request.error); };
  });
  return dbPromise;
}
function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function readAssignments() {
  try { return JSON.parse(localStorage.getItem(ASSIGN_KEY) || "{}"); }
  catch { return {}; }
}
function writeAssignments(value) {
  localStorage.setItem(ASSIGN_KEY, JSON.stringify(value));
}
const MPCSampler = {
  buffers: new Map(),
  output: null,
  outputContext: null,
  masterVolume: (() => { try { const value = Number(localStorage.getItem(MASTER_KEY)); return Number.isFinite(value) && localStorage.getItem(MASTER_KEY) !== null ? Math.max(0, Math.min(1, value)) : 0.82; } catch { return 0.82; } })(),
  assignments: readAssignments(),
  padSettings: (() => {
    try { return JSON.parse(localStorage.getItem(ASSIGN_KEY + "-settings") || "{}"); }
    catch { return {}; }
  })(),

  async importFiles(files, audio) {
    if (!audio) throw new Error("Start the studio audio engine before importing samples.");
    const accepted = Array.from(files || []).filter(file =>
      file instanceof File && (file.type.startsWith("audio/") || /\.(wav|mp3|aif|aiff|ogg|m4a)$/i.test(file.name))
    );
    if (!accepted.length) throw new Error("Choose WAV, AIFF, MP3, OGG or M4A audio files.");
    const db = await openDB();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const imported = [];
    for (const file of accepted) {
      const id = "user-sample-" + (crypto.randomUUID?.() || Date.now() + "-" + Math.random().toString(36).slice(2));
      const record = { id, name: file.name.replace(/\.[^.]+$/, ""), fileName: file.name, type: file.type || "audio/wav", size: file.size, blob: file, createdAt: Date.now() };
      store.put(record);
      imported.push(record);
    }
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
    for (const item of imported) await this.decode(item, audio);
    return imported.map(({ id, name, fileName, size }) => ({ id, name, fileName, size }));
  },

  async list() {
    const db = await openDB();
    const tx = db.transaction(STORE, "readonly");
    const records = await requestResult(tx.objectStore(STORE).getAll());
    return records.map(({ id, name, fileName, size, type, createdAt }) => ({
      id, name, fileName, size, type, createdAt
    }));
  },

  async getSample(sampleId) {
    const db = await openDB();
    const tx = db.transaction(STORE, "readonly");
    const record = await requestResult(tx.objectStore(STORE).get(sampleId));
    if (!record) return null;
    return {
      id: record.id, name: record.name, fileName: record.fileName,
      size: record.size, type: record.type, duration: this.buffers.get(sampleId)?.duration || 0
    };
  },

  async exportAssets(sampleIds) {
    const ids = [...new Set((sampleIds || []).filter(Boolean))];
    if (!ids.length) return [];
    const db = await openDB();
    const tx = db.transaction(STORE, "readonly");
    const records = await Promise.all(ids.map(id => requestResult(tx.objectStore(STORE).get(id))));
    let totalBytes = 0;
    const assets = [];
    for (const record of records) {
      if (!record?.blob) throw new Error("A recorded MPC sample is missing from this device. Re-import it before exporting the song.");
      totalBytes += record.blob.size;
      if (totalBytes > 40000000) throw new Error("MPC sample assets exceed the 40 MB portable project limit. Remove or shorten large samples before export.");
      const bytes = new Uint8Array(await record.blob.arrayBuffer());
      let binary = "";
      const chunkSize = 0x8000;
      for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
      }
      assets.push({
        id: record.id, name: record.name, fileName: record.fileName,
        type: record.type || "audio/wav", size: record.blob.size, data: btoa(binary)
      });
    }
    return assets;
  },

  async importAssets(assets) {
    const list = Array.isArray(assets) ? assets : [];
    if (!list.length) return 0;
    let totalBytes = 0;
    const db = await openDB();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    for (const asset of list) {
      if (!asset || typeof asset.id !== "string" || typeof asset.data !== "string" || asset.data.length > 54000000) {
        throw new Error("The project contains an invalid MPC sample asset.");
      }
      const binary = atob(asset.data);
      totalBytes += binary.length;
      if (totalBytes > 40000000) throw new Error("The project MPC sample assets exceed the 40 MB import limit.");
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: asset.type || "audio/wav" });
      store.put({
        id: asset.id, name: String(asset.name || asset.fileName || "Imported Sample"),
        fileName: String(asset.fileName || "sample.wav"), type: asset.type || "audio/wav",
        size: blob.size, blob, createdAt: Date.now()
      });
      this.buffers.delete(asset.id);
    }
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
    return list.length;
  },

  async preload(sampleIds, audio) {
    const ids = [...new Set((sampleIds || []).filter(Boolean))];
    return Promise.all(ids.map(id => this.decode({ id }, audio)));
  },

  async getWaveform(sampleId, audio, bars = 96) {
    const buffer = this.buffers.get(sampleId) || await this.decode({ id: sampleId }, audio);
    const channel = buffer.getChannelData(0);
    const peaks = [];
    const block = Math.max(1, Math.floor(channel.length / bars));
    for (let i = 0; i < bars; i++) {
      let peak = 0;
      const end = Math.min(channel.length, (i + 1) * block);
      for (let j = i * block; j < end; j++) peak = Math.max(peak, Math.abs(channel[j]));
      peaks.push(peak);
    }
    return { peaks, duration: buffer.duration };
  },

  getPadSettings(bank, pad) {
    return { ...(this.padSettings[bank + "-" + pad] || {}) };
  },

  setPadSettings(bank, pad, settings = {}) {
    const key = bank + "-" + pad;
    const current = this.getPadSettings(bank, pad);
    const next = {
      start: Math.max(0, Math.min(0.99, Number(settings.start ?? current.start ?? 0))),
      end: Math.max(0.01, Math.min(1, Number(settings.end ?? current.end ?? 1))),
      pitch: Math.max(0.5, Math.min(2, Number(settings.pitch ?? current.pitch ?? 1))),
      decay: Math.max(0.05, Math.min(10, Number(settings.decay ?? current.decay ?? 10))),
      volume: Math.max(0, Math.min(1.5, Number(settings.volume ?? current.volume ?? 1))),
      pan: Math.max(-1, Math.min(1, Number(settings.pan ?? current.pan ?? 0)))
    };
    if (next.end <= next.start) next.end = Math.min(1, next.start + 0.01);
    this.padSettings = { ...this.padSettings, [key]: next };
    localStorage.setItem(ASSIGN_KEY + "-settings", JSON.stringify(this.padSettings));
    return next;
  },

  async decode(sample, audio) {
    if (this.buffers.has(sample.id)) return this.buffers.get(sample.id);
    const db = await openDB();
    const tx = db.transaction(STORE, "readonly");
    const record = await requestResult(tx.objectStore(STORE).get(sample.id));
    if (!record?.blob) throw new Error("The sample file could not be found.");
    const bytes = await record.blob.arrayBuffer();
    const buffer = await audio.decodeAudioData(bytes.slice(0));
    this.buffers.set(sample.id, buffer);
    return buffer;
  },

  assign(bank, pad, sampleId) {
    this.assignments = { ...this.assignments, [bank + "-" + pad]: sampleId };
    writeAssignments(this.assignments);
  },

  unassign(bank, pad) {
    const next = { ...this.assignments };
    delete next[bank + "-" + pad];
    this.assignments = next;
    writeAssignments(next);
  },

  getAssignment(bank, pad) {
    return this.assignments[bank + "-" + pad] || null;
  },

  exportState() {
    return {
      assignments: { ...this.assignments },
      padSettings: JSON.parse(JSON.stringify(this.padSettings || {}))
    };
  },

  importState(state = {}) {
    const assignments = state.assignments && typeof state.assignments === "object" ? state.assignments : {};
    const padSettings = state.padSettings && typeof state.padSettings === "object" ? state.padSettings : {};
    this.assignments = { ...assignments };
    this.padSettings = { ...padSettings };
    writeAssignments(this.assignments);
    localStorage.setItem(ASSIGN_KEY + "-settings", JSON.stringify(this.padSettings));
  },

  ensureOutput(audio) {
    if (this.output && this.outputContext === audio) return this.output;
    const input = audio.createGain();
    input.gain.value = this.masterVolume;
    const compressor = audio.createDynamicsCompressor();
    compressor.threshold.value = -9;
    compressor.knee.value = 8;
    compressor.ratio.value = 3.5;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.14;
    const limiter = audio.createDynamicsCompressor();
    limiter.threshold.value = -1.5;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.08;
    input.connect(compressor);
    compressor.connect(limiter);
    limiter.connect(StudioAudioExport.getOutput(audio));
    this.output = input;
    this.outputContext = audio;
    return input;
  },

  setMasterVolume(value) {
    this.masterVolume = Math.max(0, Math.min(1, Number(value) || 0));
    localStorage.setItem(MASTER_KEY, String(this.masterVolume));
    if (this.output && this.outputContext) {
      this.output.gain.setTargetAtTime(this.masterVolume, this.outputContext.currentTime, 0.015);
    }
  },

  async play(sampleId, audio, options = {}) {
    const buffer = this.buffers.get(sampleId) || await this.decode({ id: sampleId }, audio);
    const startRatio = Math.max(0, Math.min(0.99, Number(options.start) || 0));
    const endRatio = Math.max(startRatio + 0.01, Math.min(1, Number(options.end) || 1));
    const start = Math.min(buffer.duration, startRatio * buffer.duration);
    const end = Math.max(start + 0.01, Math.min(buffer.duration, endRatio * buffer.duration));
    const source = audio.createBufferSource();
    const gain = audio.createGain();
    source.buffer = buffer;
    source.playbackRate.value = Math.max(0.5, Math.min(2, Number(options.pitch) || 1));
    const peak = Math.max(0, Math.min(1.5, Number(options.velocity) || 1))
      * Math.max(0, Math.min(1.5, Number(options.volume ?? 1)));
    const panner = audio.createStereoPanner ? audio.createStereoPanner() : null;
    source.connect(gain);
    if (panner) {
      panner.pan.value = Math.max(-1, Math.min(1, Number(options.pan) || 0));
      gain.connect(panner);
      panner.connect(this.ensureOutput(audio));
    } else gain.connect(this.ensureOutput(audio));
    const when = Math.max(audio.currentTime, Number(options.when) || audio.currentTime);
    const playbackDuration = Math.max(0.01, end - start) / source.playbackRate.value;
    const requestedDecay = Number(options.decay);
    const audibleDuration = Number.isFinite(requestedDecay) && requestedDecay < 10
      ? Math.min(playbackDuration, Math.max(0.05, requestedDecay))
      : playbackDuration;
    if (peak <= 0) {
      gain.gain.value = 0;
    } else {
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), when + 0.003);
      gain.gain.setTargetAtTime(0.0001, Math.max(when + 0.004, when + audibleDuration - 0.008), 0.008);
    }
    source.start(when, start, Math.max(0.01, end - start));
    return source;
  },

  async remove(sampleId) {
    const db = await openDB();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(sampleId);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
    });
    this.buffers.delete(sampleId);
    const next = { ...this.assignments };
    for (const key of Object.keys(next)) if (next[key] === sampleId) delete next[key];
    this.assignments = next;
    writeAssignments(next);
  }
};
export default MPCSampler;
