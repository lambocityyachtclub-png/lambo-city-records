const DATABASE_VERSION = 1;
const TASK_STORE = "task-state";
const REVIEW_STORE = "reviews";
const TASK_STATE_KEY = "development-director-tasks";

const REVIEW_STATUSES = Object.freeze({
  PENDING: "awaiting_owner_review",
  APPROVED: "approved",
  REJECTED: "rejected"
});

function requireText(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(name + " is required.");
  }
  return value.trim();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
  });
}

function transactionResult(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction aborted."));
    transaction.onerror = () => reject(transaction.error || new Error("IndexedDB transaction failed."));
  });
}

function createReviewId(cryptoApi) {
  if (typeof cryptoApi?.randomUUID === "function") {
    return "review-" + cryptoApi.randomUUID();
  }
  if (typeof cryptoApi?.getRandomValues !== "function") {
    throw new Error("A secure browser crypto implementation is required for review IDs.");
  }
  const bytes = new Uint8Array(16);
  cryptoApi.getRandomValues(bytes);
  return "review-" + Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
}

export function createIndexedDbDevelopmentStorage(options = {}) {
  const indexedDBApi = options.indexedDB || globalThis.indexedDB;
  const cryptoApi = options.crypto || globalThis.crypto;
  const databaseName = options.databaseName || "lambo-city-alive-owner";

  if (!indexedDBApi || typeof indexedDBApi.open !== "function") {
    throw new Error("IndexedDB is not available in this browser.");
  }
  if (typeof databaseName !== "string" || !databaseName.trim() || databaseName.length > 120) {
    throw new Error("A valid IndexedDB databaseName is required.");
  }

  let databasePromise = null;
  let closed = false;
  let taskWriteQueue = Promise.resolve();

  async function openDatabase() {
    if (closed) throw new Error("IndexedDB development storage has been closed.");
    if (!databasePromise) {
      databasePromise = new Promise((resolve, reject) => {
        const request = indexedDBApi.open(databaseName, DATABASE_VERSION);
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains(TASK_STORE)) {
            database.createObjectStore(TASK_STORE, { keyPath: "key" });
          }
          if (!database.objectStoreNames.contains(REVIEW_STORE)) {
            database.createObjectStore(REVIEW_STORE, { keyPath: "id" });
          }
        };
        request.onsuccess = () => {
          const database = request.result;
          database.onversionchange = () => {
            database.close();
            databasePromise = null;
          };
          resolve(database);
        };
        request.onerror = () => reject(request.error || new Error("Could not open ALIVE IndexedDB storage."));
        request.onblocked = () => reject(new Error("ALIVE IndexedDB upgrade is blocked by another open tab."));
      }).catch(error => {
        databasePromise = null;
        throw error;
      });
    }
    return databasePromise;
  }

  async function transact(storeName, mode, operation) {
    const database = await openDatabase();
    const transaction = database.transaction(storeName, mode);
    const completed = transactionResult(transaction);
    try {
      const result = await operation(transaction.objectStore(storeName));
      await completed;
      return result;
    } catch (error) {
      try { transaction.abort(); } catch { /* transaction may already be closed */ }
      await completed.catch(() => {});
      throw error;
    }
  }

  const taskStorage = Object.freeze({
    async load() {
      await taskWriteQueue;
      const record = await transact(TASK_STORE, "readonly", store =>
        requestResult(store.get(TASK_STATE_KEY))
      );
      const tasks = record?.value ?? [];
      if (!Array.isArray(tasks)) {
        throw new Error("ALIVE IndexedDB task state has an invalid format.");
      }
      return clone(tasks);
    },

    save(tasks) {
      if (!Array.isArray(tasks)) {
        return Promise.reject(new Error("Development tasks must be an array."));
      }
      const snapshot = clone(tasks);
      const operation = taskWriteQueue.then(() =>
        transact(TASK_STORE, "readwrite", store =>
          requestResult(store.put({ key: TASK_STATE_KEY, value: snapshot }))
        )
      );
      taskWriteQueue = operation.catch(() => {});
      return operation;
    }
  });

  const reviewStore = Object.freeze({
    async createReview(input = {}) {
      const taskId = requireText(input.taskId, "Task ID");
      const taskTitle = requireText(input.taskTitle, "Task title");
      if (!Array.isArray(input.changedFiles)) {
        throw new Error("changedFiles must be an array.");
      }
      if (!input.testResults || input.testResults.passed !== true) {
        throw new Error("Only proposals with passing tests can enter review.");
      }
      const now = new Date().toISOString();
      const review = {
        id: createReviewId(cryptoApi),
        taskId,
        taskTitle,
        area: input.area || null,
        runner: input.runner || null,
        workspaceId: input.workspaceId || null,
        changedFiles: [...new Set(input.changedFiles.map(file => requireText(file, "Changed file")))],
        changes: input.changes || null,
        testResults: clone(input.testResults),
        status: REVIEW_STATUSES.PENDING,
        productionChangesMade: false,
        createdAt: now,
        updatedAt: now,
        decision: null
      };
      await transact(REVIEW_STORE, "readwrite", store => requestResult(store.add(review)));
      return clone(review);
    },

    async getReview(reviewId) {
      const id = requireText(reviewId, "Review ID");
      const review = await transact(REVIEW_STORE, "readonly", store => requestResult(store.get(id)));
      return review ? clone(review) : null;
    },

    async listReviews(filters = {}) {
      const reviews = await transact(REVIEW_STORE, "readonly", store => requestResult(store.getAll()));
      const filtered = filters.status
        ? reviews.filter(review => review.status === filters.status)
        : reviews;
      filtered.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
      return clone(filtered);
    },

    async decideReview(input = {}) {
      const reviewId = requireText(input.reviewId, "Review ID");
      const decision = requireText(input.decision, "Decision");
      const ownerNote = input.ownerNote == null ? null : requireText(input.ownerNote, "Owner note");
      if (decision !== REVIEW_STATUSES.APPROVED && decision !== REVIEW_STATUSES.REJECTED) {
        throw new Error("Decision must be approved or rejected.");
      }
      return transact(REVIEW_STORE, "readwrite", async store => {
        const review = await requestResult(store.get(reviewId));
        if (!review) throw new Error("Review not found: " + reviewId);
        if (review.status !== REVIEW_STATUSES.PENDING) {
          throw new Error("This review has already received a decision.");
        }
        const updatedAt = new Date().toISOString();
        const updated = {
          ...review,
          status: decision,
          updatedAt,
          decision: { status: decision, ownerNote, decidedAt: updatedAt },
          productionChangesMade: false
        };
        await requestResult(store.put(updated));
        return clone(updated);
      });
    },

    REVIEW_STATUSES
  });

  async function close() {
    if (closed) return;
    closed = true;
    const database = await databasePromise?.catch(() => null);
    database?.close();
    databasePromise = null;
  }

  return Object.freeze({
    databaseName,
    taskStorage,
    reviewStore,
    close,
    REVIEW_STATUSES
  });
}
