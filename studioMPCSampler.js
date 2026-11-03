// LAMBO CITY RECORDS — MPC SAMPLE ENGINE
// Real user-owned audio samples, persistent in IndexedDB, independent of Beat Lab.
import StudioAudioEngine from "./studioAudioEngine.js";

const DB_NAME = "lambo-city-mpc-samples";
const STORE = "samples";
const ASSIGN_KEY = "lambocity-mpc-sample-assignments-v1";
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
  assignments: readAssignments(),

  async importFiles(files, audio) {
    if (!audio) throw new Error("Start the studio audio engine before importing samples.");
    const accepted = Array.from(files || []).filter(file =>
      file instanceof File && (file.type.startsWith("audio/") || /\\.(wav|mp3|aif|aiff|ogg|m4a)$/i.test(file.name))
    );
    if (!accepted.length) throw new Error("Choose WAV, AIFF, MP3, OGG or M4A audio files.");
    const db = await openDB();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const imported = [];
    for (const file of accepted) {
      const id = "user-sample-" + (crypto.randomUUID?.() || Date.now() + "-" + Math.random().toString(36).slice(2));
      const record = { id, name: file.name.replace(/\\.[^.]+$/, ""), fileName: file.name, type: file.type || "audio/wav", size: file.size, blob: file, createdAt: Date.now() };
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
    return records.map(({ id, name, fileName, size }) => ({ id, name, fileName, size }));
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

  getAssignment(bank, pad) {
    return this.assignments[bank + "-" + pad] || null;
  },

  async play(sampleId, audio, options = {}) {
    const buffer = await this.decode({ id: sampleId }, audio);
    const start = Math.max(0, Math.min(buffer.duration, Number(options.start) || 0));
    const end = Math.max(start + 0.01, Math.min(buffer.duration, Number(options.end) || buffer.duration));
    const source = audio.createBufferSource();
    const gain = audio.createGain();
    source.buffer = buffer;
    source.playbackRate.value = Math.max(0.5, Math.min(2, Number(options.pitch) || 1));
    gain.gain.value = Math.max(0, Math.min(1.5, Number(options.velocity) || 1));
    source.connect(gain);
    const destination = StudioAudioEngine.master || audio.destination;
    gain.connect(destination);
    const when = Math.max(audio.currentTime, Number(options.when) || audio.currentTime);
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
