import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8")
);

assert.equal(manifest.private, true);
assert.equal(manifest.type, "module");
assert.equal(manifest.engines?.node, "24.x");
assert.equal(manifest.dependencies?.["@vercel/sandbox"], "4.1.0");
assert.equal(manifest.dependencies?.pg, "8.23.1");
assert.equal(Number(process.versions.node.split(".")[0]), 24);

const [sandboxModule, postgresModule] = await Promise.all([
  import("@vercel/sandbox"),
  import("pg")
]);

assert.equal(
  typeof sandboxModule.Sandbox?.create,
  "function",
  "Vercel Sandbox SDK must expose Sandbox.create()."
);
assert.equal(
  typeof postgresModule.Pool,
  "function",
  "node-postgres must expose Pool."
);

console.log("ALIVE hosted runtime dependencies are installed and importable on Node 24.");
