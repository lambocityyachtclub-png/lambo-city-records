import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { chromium, webkit } from "playwright";

const root = process.cwd();
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, "http://127.0.0.1").pathname;
    if (pathname === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end("<!doctype html><html><head><meta charset='utf-8'></head><body>IndexedDB browser test</body></html>");
      return;
    }
    if (!pathname.startsWith("/development/content/")) {
      res.writeHead(404); res.end("Not found"); return;
    }
    const file = path.resolve(root, "." + pathname);
    if (!file.startsWith(path.resolve(root, "development/content") + path.sep)) {
      res.writeHead(403); res.end("Forbidden"); return;
    }
    const content = await readFile(file);
    res.writeHead(200, { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-store" });
    res.end(content);
  } catch {
    res.writeHead(404); res.end("Not found");
  }
});

await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const baseUrl = "http://127.0.0.1:" + address.port;

async function runBrowser(name, browserType) {
  const browser = await browserType.launch({ headless: true });
  try {
    const page = await browser.newPage();
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

      const quotaEvents = [];
      const constrainedCache = createIndexedDbContentCache({
        indexedDB,
        databaseName: databaseName + "-small",
        maxEntryBytes: 1,
        onError: event => quotaEvents.push(event)
      });
      let quotaDownloads = 0;
      const quotaSafeLoader = createVerifiedRemoteContentLoader({
        allowedOrigins: ["https://assets.example.test"],
        resolve: async () => { quotaDownloads += 1; return payload; },
        sha256,
        cache: constrainedCache,
        onCacheError: event => quotaEvents.push(event)
      });
      const usable = await quotaSafeLoader(request);
      if (quotaDownloads !== 1 || usable.join(",") !== payload.join(",") || quotaEvents.length === 0) {
        throw new Error("Cache capacity failure blocked verified content delivery.");
      }
      await constrainedCache.close();
      indexedDB.deleteDatabase(databaseName);
      indexedDB.deleteDatabase(databaseName + "-small");
      return { downloads, persisted: true, corruptionRecovered: true, quotaFallback: true };
    });
    console.log(name + ": " + JSON.stringify(result));
  } finally {
    await browser.close();
  }
}

try {
  await runBrowser("Chromium", chromium);
  await runBrowser("WebKit", webkit);
} finally {
  await new Promise(resolve => server.close(resolve));
}
