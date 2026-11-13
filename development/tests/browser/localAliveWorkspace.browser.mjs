import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { chromium, webkit } from "playwright";

const root = process.cwd();
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, "http://127.0.0.1").pathname;
    const allowedRootFiles = new Set(["/alive.html", "/alive.js", "/alive.css"]);
    if (!pathname.startsWith("/development/") && !allowedRootFiles.has(pathname)) {
      res.writeHead(404); res.end("Not found"); return;
    }
    const file = path.resolve(root, "." + pathname);
    const developmentRoot = path.resolve(root, "development") + path.sep;
    const repositoryRoot = path.resolve(root) + path.sep;
    const allowed = pathname.startsWith("/development/")
      ? file.startsWith(developmentRoot)
      : file.startsWith(repositoryRoot);
    if (!allowed) { res.writeHead(403); res.end("Forbidden"); return; }
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

async function testBrowser(name, browserType, contextOptions = {}) {
  const browser = await browserType.launch({ headless: true });
  try {
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();
    const externalRequests = [];
    page.on("request", request => {
      if (new URL(request.url()).origin !== baseUrl) externalRequests.push(request.url());
    });

    await page.goto(baseUrl + "/alive.html");
    await page.waitForFunction(() =>
      document.querySelector("#workspace-status")?.textContent === "Ready · local only"
    );

    await page.locator("#vision").fill("Keep the LAMBO CITY world and Floor 2 Studio protected while ALIVE grows.");
    await page.locator("#save-vision").click();
    await page.waitForFunction(() =>
      document.querySelector("#vision-count")?.textContent === "1" &&
      document.querySelector("#visions-empty")?.classList.contains("hidden") === true &&
      (document.querySelector("#vision-message")?.textContent || "").includes("Saved locally")
    );

    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
    assert.match(csp, /connect-src 'none'/);
    assert.equal(externalRequests.length, 0);

    await page.reload();
    await page.waitForFunction(() =>
      document.querySelector("#workspace-status")?.textContent === "Ready · local only" &&
      document.querySelector("#vision-count")?.textContent === "1"
    );

    const persisted = await page.evaluate(async () => {
      const { createLocalAliveControlPlane } = await import("/development/runtime/createLocalAliveControlPlane.js");
      const databaseName = "lc-alive-browser-verification-" + Math.random().toString(36).slice(2);
      const core = await createLocalAliveControlPlane({ indexedDB, databaseName });
      const vision = await core.visionStore.createVision({
        vision: "Browser-local ALIVE persistence verification."
      });
      const task = await core.system.director.createTask({
        title: "Verify protected task approval",
        description: "This task remains a local record and does not execute.",
        area: "studio_audio",
        runner: "studio",
        requiresApproval: true,
        protectedActions: ["major_architecture"],
        acceptanceCriteria: ["Owner approval is required."]
      });
      if (task.status !== "pending_approval") throw new Error("Protected task bypassed owner approval.");
      const approvedTask = await core.system.director.approveTask(task.id);
      const review = await core.reviewStore.createReview({
        taskId: task.id,
        taskTitle: task.title,
        area: task.area,
        runner: task.runner,
        changedFiles: ["development/runtime/createLocalAliveControlPlane.js"],
        testResults: { passed: true, summary: "Browser test fixture." }
      });
      const decidedReview = await core.reviewStore.decideReview({
        reviewId: review.id,
        decision: "approved",
        ownerNote: "Records a decision only."
      });
      if (decidedReview.productionChangesMade !== false) throw new Error("Review implied a production change.");
      await core.close();

      const reopened = await createLocalAliveControlPlane({ indexedDB, databaseName });
      const tasks = reopened.system.director.listTasks();
      const savedVision = await reopened.visionStore.getVision(vision.id);
      const savedReview = await reopened.reviewStore.getReview(review.id);
      const result = {
        storageMode: reopened.storageMode,
        localOnly: reopened.localOnly,
        hostedQueueConfigured: reopened.hostedQueueConfigured,
        aiProviderConfigured: reopened.aiProviderConfigured,
        sandboxConfigured: reopened.sandboxConfigured,
        configuredExecutionWorkers: reopened.configuredExecutionWorkers,
        taskCount: tasks.length,
        taskStatus: tasks[0]?.status,
        approvedTaskStatus: approvedTask.status,
        visionText: savedVision?.vision,
        visionRemoteStatus: savedVision?.remoteStatus,
        reviewStatus: savedReview?.status,
        productionChangesMade: savedReview?.productionChangesMade
      };
      await reopened.close();
      indexedDB.deleteDatabase(databaseName);
      return result;
    });

    assert.equal(persisted.storageMode, "browser-indexeddb");
    assert.equal(persisted.localOnly, true);
    assert.equal(persisted.hostedQueueConfigured, false);
    assert.equal(persisted.aiProviderConfigured, false);
    assert.equal(persisted.sandboxConfigured, false);
    assert.deepEqual(persisted.configuredExecutionWorkers, []);
    assert.equal(persisted.taskCount, 1);
    assert.equal(persisted.taskStatus, "queued");
    assert.equal(persisted.approvedTaskStatus, "queued");
    assert.equal(persisted.visionText, "Browser-local ALIVE persistence verification.");
    assert.equal(persisted.visionRemoteStatus, "not_submitted");
    assert.equal(persisted.reviewStatus, "approved");
    assert.equal(persisted.productionChangesMade, false);
    assert.equal(externalRequests.length, 0);

    process.stdout.write(name + ": local workspace, persistence, approval boundary and no-network checks passed.\n");
    await context.close();
  } finally {
    await browser.close();
  }
}

try {
  await testBrowser("Chromium", chromium);
  await testBrowser("WebKit iPad-sized viewport", webkit, {
    viewport: { width: 1024, height: 1366 },
    deviceScaleFactor: 2,
    hasTouch: true
  });
} finally {
  await new Promise(resolve => server.close(resolve));
}
