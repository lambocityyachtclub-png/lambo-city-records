const DATABASE_NAME = "lambo-city-studio-sessions";
const DATABASE_VERSION = 2;
const STORE_NAME = "sessions";
const RECOVERY_STORE = "recovery";
const VERSION_STORE = "versions";
let databasePromise = null;

function openDatabase() {
  if (databasePromise) return databasePromise;
  if (!globalThis.indexedDB) return Promise.reject(new Error("IndexedDB is unavailable in this browser."));
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: "projectId" });
      if (!database.objectStoreNames.contains(RECOVERY_STORE)) database.createObjectStore(RECOVERY_STORE, { keyPath: "projectId" });
      if (!database.objectStoreNames.contains(VERSION_STORE)) {
        const versions = database.createObjectStore(VERSION_STORE, { keyPath: "versionId" });
        versions.createIndex("projectId", "projectId", { unique: false });
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => { database.close(); databasePromise = null; };
      resolve(database);
    };
    request.onerror = () => { databasePromise = null; reject(request.error || new Error("Could not open studio session storage.")); };
    request.onblocked = () => { databasePromise = null; reject(new Error("Studio storage upgrade is blocked by another open tab. Close other LAMBO CITY Studio tabs and retry.")); };
  });
  return databasePromise;
}

function transactionComplete(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => reject(transaction.error || new Error("Studio session storage failed."));
    transaction.onabort = () => reject(transaction.error || new Error("Studio session storage was interrupted."));
  });
}

function requestResult(request, message) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error || new Error(message));
  });
}

const StudioDAWSessionStore = {
  async save(projectId, session) {
    if (typeof projectId !== "string" || !projectId.trim()) throw new Error("A saved song project ID is required.");
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({ ...session, projectId });
    await transactionComplete(transaction);
    return true;
  },

  async load(projectId) {
    if (typeof projectId !== "string" || !projectId.trim()) return null;
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, "readonly");
    const complete = transactionComplete(transaction);
    const request = transaction.objectStore(STORE_NAME).get(projectId);
    const record = await requestResult(request, "Could not load the saved studio session.");
    await complete;
    return record;
  },

  async list() {
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, "readonly");
    const complete = transactionComplete(transaction);
    const records = await requestResult(transaction.objectStore(STORE_NAME).getAll(), "Could not list saved studio sessions.");
    await complete;
    return (records || []).map(record => ({
      projectId: record.projectId,
      projectName: record.projectName || "Untitled Song",
      updatedAt: record.updatedAt || null,
      trackCount: Array.isArray(record.tracks) ? record.tracks.length : 0
    })).sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  },

  async saveRecovery(projectId, session) {
    if (!projectId) throw new Error("A recovery project ID is required.");
    const database = await openDatabase();
    const transaction = database.transaction(RECOVERY_STORE, "readwrite");
    transaction.objectStore(RECOVERY_STORE).put({ ...session, projectId, recoveryAt: new Date().toISOString() });
    await transactionComplete(transaction);
    return true;
  },

  async listRecovery() {
    const database = await openDatabase();
    const transaction = database.transaction(RECOVERY_STORE, "readonly");
    const complete = transactionComplete(transaction);
    const records = await requestResult(transaction.objectStore(RECOVERY_STORE).getAll(), "Could not scan recovery checkpoints.");
    await complete;
    return (records || []).map(record => ({
      projectId: record.projectId,
      projectName: record.projectName || "Untitled Song",
      recoveryAt: record.recoveryAt || record.updatedAt || null,
      trackCount: Array.isArray(record.tracks) ? record.tracks.length : 0
    })).sort((a, b) => String(b.recoveryAt || "").localeCompare(String(a.recoveryAt || "")));
  },

  async loadRecovery(projectId) {
    if (!projectId) return null;
    const database = await openDatabase();
    const transaction = database.transaction(RECOVERY_STORE, "readonly");
    const complete = transactionComplete(transaction);
    const record = await requestResult(transaction.objectStore(RECOVERY_STORE).get(projectId), "Could not read the recovery checkpoint.");
    await complete;
    return record;
  },

  async clearRecovery(projectId) {
    if (!projectId) return false;
    const database = await openDatabase();
    const transaction = database.transaction(RECOVERY_STORE, "readwrite");
    transaction.objectStore(RECOVERY_STORE).delete(projectId);
    await transactionComplete(transaction);
    return true;
  },

  async saveVersion(projectId, session, label = "Manual save") {
    if (!projectId) throw new Error("A version history project ID is required.");
    const database = await openDatabase();
    const versionId = projectId + "::" + Date.now() + "::" + Math.random().toString(36).slice(2, 7);
    const record = { versionId, projectId, projectName: session.projectName || "Untitled Song", label, createdAt: new Date().toISOString(), session };
    const transaction = database.transaction(VERSION_STORE, "readwrite");
    transaction.objectStore(VERSION_STORE).put(record);
    await transactionComplete(transaction);
    const versions = await this.listVersions(projectId);
    for (const old of versions.slice(20)) await this.removeVersion(old.versionId);
    return versionId;
  },

  async listVersions(projectId) {
    const database = await openDatabase();
    const transaction = database.transaction(VERSION_STORE, "readonly");
    const complete = transactionComplete(transaction);
    const index = transaction.objectStore(VERSION_STORE).index("projectId");
    const records = await requestResult(index.getAll(projectId), "Could not list session versions.");
    await complete;
    return (records || []).map(({ versionId, projectName, label, createdAt }) => ({ versionId, projectName, label, createdAt }))
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  },

  async loadVersion(versionId) {
    const database = await openDatabase();
    const transaction = database.transaction(VERSION_STORE, "readonly");
    const complete = transactionComplete(transaction);
    const record = await requestResult(transaction.objectStore(VERSION_STORE).get(versionId), "Could not load the selected session version.");
    await complete;
    return record || null;
  },

  async removeVersion(versionId) {
    const database = await openDatabase();
    const transaction = database.transaction(VERSION_STORE, "readwrite");
    transaction.objectStore(VERSION_STORE).delete(versionId);
    await transactionComplete(transaction);
    return true;
  },

  async remove(projectId) {
    if (typeof projectId !== "string" || !projectId.trim()) return false;
    const database = await openDatabase();
    const transaction = database.transaction([STORE_NAME, RECOVERY_STORE, VERSION_STORE], "readwrite");
    transaction.objectStore(STORE_NAME).delete(projectId);
    transaction.objectStore(RECOVERY_STORE).delete(projectId);
    const index = transaction.objectStore(VERSION_STORE).index("projectId");
    const request = index.openKeyCursor(IDBKeyRange.only(projectId));
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) { transaction.objectStore(VERSION_STORE).delete(cursor.primaryKey); cursor.continue(); }
    };
    await transactionComplete(transaction);
    return true;
  }
};

export default StudioDAWSessionStore;
