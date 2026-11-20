import test from "node:test";
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOTS = ["development", "alive", "api"];
const IGNORED = new Set(["node_modules", ".git", ".vercel", "dist", "build"]);

async function collectJavaScriptFiles(directory, output = []) {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === "ENOENT") return output; throw error; }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (IGNORED.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await collectJavaScriptFiles(absolute, output);
    else if (entry.isFile() && /\.(?:js|mjs|cjs)$/.test(entry.name)) output.push(absolute);
  }
  return output;
}

test("all ALIVE, API, and development JavaScript modules parse before deployment", async () => {
  const files = [];
  for (const root of ROOTS) await collectJavaScriptFiles(path.resolve(root), files);
  assert.ok(files.length > 0, "Expected ALIVE source files to be present.");
  const failures = [];
  for (const file of files) {
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (result.status !== 0) failures.push(file + "\n" + (result.stderr || result.stdout || "Syntax check failed."));
  }
  assert.deepEqual(failures, [], failures.join("\n\n"));
});
