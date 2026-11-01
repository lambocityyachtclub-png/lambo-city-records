
/*
 * LAMBO CITY RECORDS
 * STUDIO AUDIO ASSET STORE V1
 *
 * Purpose:
 * - Persist recorded audio using IndexedDB.
 * - Store Beats, Vocals and Master Mix separately.
 * - Retrieve audio by project and asset ID.
 * - Support future .lcp project packaging.
 *
 * Independent module.
 * Does not modify the existing recording engine.
 */

const DB_NAME = "lambo-city-studio-assets";
const DB_VERSION = 1;
const STORE_NAME = "audioAssets";

let databasePromise = null;

function openDatabase() {
  if (!globalThis.indexedDB) {
    throw new Error("IndexedDB is not supported.");
  }

  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id"
        });

        store.createIndex("projectId", "projectId");
        store.createIndex("takeId", "takeId");
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      db.onversionchange = () => {
        db.close();
        databasePromise = null;
      };

      resolve(db);
    };

    request.onerror = () => {
      databasePromise = null;
      reject(request.error);
    };
  });

  return databasePromise;
}

function transactionDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function validateAsset(asset) {
  if (!asset || typeof asset !== "object") {
    throw new Error("Audio asset is required.");
  }

  if (!asset.id || !asset.projectId) {
    throw new Error("Asset ID and project ID are required.");
  }

  if (!(asset.blob instanceof Blob) || asset.blob.size === 0) {
    throw new Error("A valid audio Blob is required.");
  }

  if (!["beat", "vocal", "mix"].includes(asset.trackName)) {
    throw new Error("Invalid audio track type.");
  }
}

const StudioAudioAssetStore = {

  async save(asset) {
    validateAsset(asset);

    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, "readwrite");

    const record = {
      id: asset.id,
      projectId: asset.projectId,
      takeId: asset.takeId || null,
      trackName: asset.trackName,
      createdAt: asset.createdAt || new Date().toISOString(),
      mimeType: asset.blob.type,
      size: asset.blob.size,
      blob: asset.blob
    };

    const request = tx.objectStore(STORE_NAME).put(record);

    const result = new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(record.id);
      request.onerror = () => reject(request.error);
    });

    await Promise.all([result, transactionDone(tx)]);

    return record.id;
  },

  async get(assetId) {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, "readonly");

    const request = tx.objectStore(STORE_NAME).get(assetId);

    const result = new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    const [record] = await Promise.all([
      result,
      transactionDone(tx)
    ]);

    return record;
  },

  async listByProject(projectId) {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, "readonly");

    const request = tx.objectStore(STORE_NAME)
      .index("projectId")
      .getAll(projectId);

    const result = new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    const [records] = await Promise.all([
      result,
      transactionDone(tx)
    ]);

    return records.map(({ blob, ...metadata }) => metadata);
  },

  async delete(assetId) {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, "readwrite");

    tx.objectStore(STORE_NAME).delete(assetId);

    await transactionDone(tx);

    return true;
  },

  async deleteProject(projectId) {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, "readwrite");

    const store = tx.objectStore(STORE_NAME);
    const request = store.index("projectId")
      .openKeyCursor(IDBKeyRange.only(projectId));

    request.onsuccess = () => {
      const cursor = request.result;

      if (!cursor) return;

      store.delete(cursor.primaryKey);
      cursor.continue();
    };

    await transactionDone(tx);

    return true;
  },

  async isAvailable() {
    try {
      await openDatabase();
      return true;
    } catch {
      return false;
    }
  }
};

export default StudioAudioAssetStore;
