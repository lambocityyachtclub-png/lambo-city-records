const DATABASE_NAME = "lambo-city-studio-sessions";
const DATABASE_VERSION = 1;
const STORE_NAME = "sessions";
let databasePromise = null;

function openDatabase() {
  if (databasePromise) return databasePromise;
  if (!globalThis.indexedDB) {
    return Promise.reject(new Error("IndexedDB is unavailable in this browser."));
  }
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "projectId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      databasePromise = null;
      reject(request.error || new Error("Could not open studio session storage."));
    };
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

const StudioDAWSessionStore = {
  async save(projectId, session) {
    if (typeof projectId !== "string" || !projectId.trim()) {
      throw new Error("A saved song project ID is required.");
    }
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
    const request = transaction.objectStore(STORE_NAME).get(projectId);
    const record = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("Could not load the saved studio session."));
    });
    await transactionComplete(transaction);
    if (record) delete record.projectId;
    return record;
  },

  async list() {
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).getAll();
    const records = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error || new Error("Could not list saved studio sessions."));
    });
    await transactionComplete(transaction);
    return records.map(record => ({
      projectId: record.projectId,
      projectName: record.projectName || "Untitled Song",
      updatedAt: record.updatedAt || null,
      trackCount: Array.isArray(record.tracks) ? record.tracks.length : 0
    })).sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  },

  async remove(projectId) {
    if (typeof projectId !== "string" || !projectId.trim()) return false;
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(projectId);
    await transactionComplete(transaction);
    return true;
  }
};

export default StudioDAWSessionStore;
