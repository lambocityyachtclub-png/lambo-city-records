import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { chromium, webkit } from "playwright";

const root = process.cwd();
let hostedVisionSubmissionRequests = 0;
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, "http://127.0.0.1").pathname;
    if (pathname === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end("<!doctype html><html><head><meta charset='utf-8'></head><body>IndexedDB browser test</body></html>");
      return;
    }
    if (pathname === "/api/alive/session" && req.method === "GET") {
      res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
      res.end(JSON.stringify({ configured: true, authenticated: true }));
      return;
    }
    if (pathname === "/api/alive/status") {
      res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
      res.end(JSON.stringify({ connected: false }));
      return;
    }
    if (pathname === "/api/alive/vision") {
      hostedVisionSubmissionRequests += 1;
      res.writeHead(500, { "content-type": "application/json", "cache-control": "no-store" });
      res.end(JSON.stringify({ error: "Hosted vision submission must remain off in this browser test." }));
      return;
    }
    const rootFiles = new Set(["/alive.html", "/alive.js", "/alive.css"]);
    if (!pathname.startsWith("/development/") && !rootFiles.has(pathname)) {
      res.writeHead(404); res.end("Not found"); return;
    }
    const file = path.resolve(root, "." + pathname);
    const allowedRoot = pathname.startsWith("/development/")
      ? path.resolve(root, "development") + path.sep
      : path.resolve(root) + path.sep;
    if (!file.startsWith(allowedRoot)) {
      res.writeHead(403); res.end("Forbidden"); return;
    }
    const content = await readFile(file);
    const extension = path.extname(file);
    const contentType = extension === ".html" ? "text/html; charset=utf-8"
      : extension === ".css" ? "text/css; charset=utf-8"
        : "text/javascript; charset=utf-8";
    res.writeHead(200, { "content-type": contentType, "cache-control": "no-store" });
    res.end(content);
  } catch {
    res.writeHead(404); res.end("Not found");
  }
});

await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const baseUrl = "http://127.0.0.1:" + address.port;

async function runBrowser(name, browserType, contextOptions = {}) {
  const browser = await browserType.launch({ headless: true });
  try {
    const page = await browser.newPage(contextOptions);
    await page.goto(baseUrl);
    const result = await page.evaluate(async () => {
      const { createIndexedDbContentCache } = await import("/development/content/indexedDbContentCache.js");
      const { createVerifiedRemoteContentLoader } = await import("/development/content/verifiedRemoteContentLoader.js");
      const databaseName = "lc-browser-cache-" + Math.random().toString(36).slice(2);
      const payload = new Uint8Array([11, 22, 33, 44]);
      const digestBytes = await crypto.subtle.digest("SHA-256", payload);
      const digest = Array.from(new Uint8Array(digestBytes), byte => byte.toString(16).padStart(2, "0")).join("");
      const sha256 = async bytes => {
        const value = await crypto.subtle.digest("SHA-256", bytes);
        return Array.from(new Uint8Array(value), byte => byte.toString(16).padStart(2, "0")).join("");
      };
      const request = {
        pack: { id: "lc.browser.test", version: "1.0.0" },
        asset: {
          id: "test-audio",
          cacheKey: "lc.browser.test:test-audio",
          integrity: { algorithm: "sha256", digest }
        },
        source: { kind: "url", locator: "https://assets.example.test/test-audio.bin" }
      };
      let downloads = 0;
      const cache = createIndexedDbContentCache({ indexedDB, databaseName });
      const loader = createVerifiedRemoteContentLoader({
        allowedOrigins: ["https://assets.example.test"],
        resolve: async () => { downloads += 1; return payload; },
        sha256,
        cache
      });
      const first = await loader(request);
      const second = await loader(request);
      if (downloads !== 1 || first.join(",") !== payload.join(",") || second.join(",") !== payload.join(",")) {
        throw new Error("Browser IndexedDB cache did not persist/reuse verified bytes.");
      }
      await cache.close();

      const reopened = createIndexedDbContentCache({ indexedDB, databaseName });
      const persistentLoader = createVerifiedRemoteContentLoader({
        allowedOrigins: ["https://assets.example.test"],
        resolve: async () => { throw new Error("Persisted cache unexpectedly missed."); },
        sha256,
        cache: reopened
      });
      const persisted = await persistentLoader(request);
      if (persisted.join(",") !== payload.join(",")) throw new Error("Cache did not survive database close/reopen.");

      const key = "lc.browser.test:test-audio:sha256:" + digest;
      await reopened.set(key, new Uint8Array([0, 0, 0]));
      let repairedDownloads = 0;
      const repairLoader = createVerifiedRemoteContentLoader({
        allowedOrigins: ["https://assets.example.test"],
        resolve: async () => { repairedDownloads += 1; return payload; },
        sha256,
        cache: reopened
      });
      const repaired = await repairLoader(request);
      if (repairedDownloads !== 1 || repaired.join(",") !== payload.join(",")) {
        throw new Error("Corrupt persistent cache entry was not replaced.");
      }
      await reopened.close();

      const capacityEvents = [];
      const constrainedCache = createIndexedDbContentCache({
        indexedDB,
        databaseName: databaseName + "-small",
        maxEntryBytes: 1,
        onError: event => capacityEvents.push(event)
      });
      let oversizeDownloads = 0;
      const capacitySafeLoader = createVerifiedRemoteContentLoader({
        allowedOrigins: ["https://assets.example.test"],
        resolve: async () => { oversizeDownloads += 1; return payload; },
        sha256,
        cache: constrainedCache,
        onCacheError: event => capacityEvents.push(event)
      });
      const usable = await capacitySafeLoader(request);
      if (oversizeDownloads !== 1 || usable.join(",") !== payload.join(",") || capacityEvents.length === 0) {
        throw new Error("Oversized cache-entry rejection blocked verified content delivery.");
      }
      await constrainedCache.close();

      const { createLocalAliveControlPlane } = await import("/development/runtime/createLocalAliveControlPlane.js");
      const localDatabaseName = databaseName + "-alive-core";
      const localCore = await createLocalAliveControlPlane({ indexedDB, databaseName: localDatabaseName });
      const localSnapshot = localCore.getSnapshot();
      if (
        localCore.storageMode !== "browser-indexeddb" ||
        localCore.localOnly !== true ||
        localCore.aiProviderConfigured !== false ||
        localCore.sandboxConfigured !== false ||
        localCore.hostedQueueConfigured !== false ||
        localSnapshot.hostedQueueConfigured !== false ||
        localSnapshot.configuredExecutionWorkers.length !== 0
      ) {
        throw new Error("Local ALIVE core unexpectedly enabled an external provider or execution adapter.");
      }
      const localVision = await localCore.visionStore.createVision({
        vision: "Create a local-first LAMBO CITY owner planning inbox."
      });
      if (localVision.remoteStatus !== "not_submitted" || localVision.remoteTaskId !== null) {
        throw new Error("Local vision was incorrectly marked as submitted to a hosted queue.");
      }
      await localCore.visionStore.setRemoteStatus({
        visionId: localVision.id,
        remoteStatus: "unavailable"
      });
      const createdTask = await localCore.system.director.createTask({
        title: "Browser-local ALIVE persistence check",
        description: "Verify task and owner approval records persist without hosted services.",
        area: "studio_audio",
        runner: "studio",
        requiresApproval: true,
        protectedActions: ["major_architecture"],
        acceptanceCriteria: ["Task survives closing and reopening the local ALIVE database."]
      });
      if (createdTask.status !== "pending_approval") {
        throw new Error("Protected local task did not enter pending owner approval.");
      }
      await localCore.system.director.approveTask(createdTask.id);
      const createdReview = await localCore.reviewStore.createReview({
        taskId: createdTask.id,
        taskTitle: createdTask.title,
        area: createdTask.area,
        runner: createdTask.runner,
        changedFiles: ["development/runtime/createLocalAliveControlPlane.js"],
        testResults: { passed: true, summary: "Browser persistence test fixture." }
      });
      const decidedReview = await localCore.reviewStore.decideReview({
        reviewId: createdReview.id,
        decision: "approved",
        ownerNote: "Approval records a decision only."
      });
      if (decidedReview.productionChangesMade !== false) {
        throw new Error("Owner review decision incorrectly implied a production change.");
      }
      await localCore.close();

      const reopenedCore = await createLocalAliveControlPlane({ indexedDB, databaseName: localDatabaseName });
      const persistedTasks = reopenedCore.system.director.listTasks();
      const persistedReview = await reopenedCore.reviewStore.getReview(createdReview.id);
      const persistedVision = await reopenedCore.visionStore.getVision(localVision.id);
      if (
        persistedTasks.length !== 1 ||
        persistedTasks[0].id !== createdTask.id ||
        persistedTasks[0].status !== "queued" ||
        !persistedReview ||
        persistedReview.status !== "approved" ||
        !persistedVision ||
        persistedVision.vision !== "Create a local-first LAMBO CITY owner planning inbox." ||
        persistedVision.remoteStatus !== "unavailable" ||
        persistedReview.productionChangesMade !== false
      ) {
        throw new Error("Local ALIVE tasks or review decisions did not survive database reopen.");
      }
      await reopenedCore.close();

      indexedDB.deleteDatabase(databaseName);
      indexedDB.deleteDatabase(databaseName + "-small");
      indexedDB.deleteDatabase(localDatabaseName);
      return {
        downloads,
        persisted: true,
        corruptionRecovered: true,
        oversizeFallback: true,
        localAliveCore: true,
        localTaskAndReviewPersistence: true,
        localVisionInboxPersistence: true,
        paidAdaptersDisabled: true
      };
    });
    hostedVisionSubmissionRequests = 0;
    await page.goto(baseUrl + "/alive.html");
    await page.waitForFunction(() =>
      document.querySelector("#local-core-status")?.textContent === "Ready"
    );
    await page.locator("#vision").fill("Keep LAMBO CITY ALIVE local-first and protect the Floor 2 Studio workflow.");
    await page.locator("#submit-vision").click();
    await page.waitForFunction(() =>
      document.querySelector("#task-state")?.textContent === "SAVED LOCALLY" &&
      (document.querySelector("#vision-message")?.textContent || "").includes("No hosted worker") &&
      (document.querySelector("#local-core-summary")?.textContent || "").includes("1 saved directions")
    );
    const ownerWorkspaceState = await page.evaluate(() => ({
      localCoreStatus: document.querySelector("#local-core-status")?.textContent,
      queueStatus: document.querySelector("#queue-status")?.textContent,
      savedVisionState: document.querySelector("#task-state")?.textContent,
      visionInputCleared: document.querySelector("#vision")?.value === "",
      message: document.querySelector("#vision-message")?.textContent || "",
      storageNote: document.querySelector(".local-storage-note")?.textContent || ""
    }));
    if (
      ownerWorkspaceState.localCoreStatus !== "Ready" ||
      ownerWorkspaceState.queueStatus !== "Off by default" ||
      ownerWorkspaceState.savedVisionState !== "SAVED LOCALLY" ||
      !ownerWorkspaceState.visionInputCleared ||
      !ownerWorkspaceState.message.includes("No hosted worker") ||
      !ownerWorkspaceState.storageNote.includes("not encrypted as a password vault") ||
      !ownerWorkspaceState.storageNote.includes("not synced or backed up") ||
      hostedVisionSubmissionRequests !== 0
    ) {
      throw new Error("Owner workspace did not save locally with hosted vision submission disabled: " + JSON.stringify(ownerWorkspaceState) + "; hosted requests=" + hostedVisionSubmissionRequests);
    }
    result.ownerWorkspaceLocalOnly = true;
    result.hostedVisionSubmissionRequests = hostedVisionSubmissionRequests;
    console.log(name + ": " + JSON.stringify(result));
  } finally {
    await browser.close();
  }
}

try {
  await runBrowser("Chromium", chromium);
  await runBrowser("WebKit", webkit);
  await runBrowser("WebKit iPad-sized touch viewport", webkit, {
    viewport: { width: 1024, height: 1366 },
    deviceScaleFactor: 2,
    hasTouch: true
  });
} finally {
  await new Promise(resolve => server.close(resolve));
}
